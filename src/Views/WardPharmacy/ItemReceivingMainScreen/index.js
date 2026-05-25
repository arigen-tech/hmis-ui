import { useEffect, useState } from "react"
import { useNavigate } from 'react-router-dom';
import LoadingScreen from "../../../Components/Loading"
import { ALL_REPORTS, INVENTORY, GET_INDENT_HEADERS_FOR_RECEIVING, GET_INDENT_DETAILS_FOR_RECEIVING, SAVE_INDENT_RECEIVING, RECEIVING_REPORT_URL, REQUEST_PARAM_RECEIVED_M_ID } from "../../../config/apiConfig"
import { getRequest, postRequest } from "../../../service/apiService"
import Popup from "../../../Components/popup"
import ConfirmationPopup from "../../../Components/ConfirmationPopup";
import DatePicker from "../../../Components/DatePicker"
import Pagination, {DEFAULT_ITEMS_PER_PAGE} from "../../../Components/Pagination";
import { formatDateForDisplay, formatDateTimeForDisplay } from "../../../utils/dateUtils";
import {
  ERROR_DEPARTMENT_ID_NOT_FOUND, ERROR_FETCH_INDENTS, CONFIRM_SAVE_INDENT_RECEIVING,
  SUCCESS_RECEIVING_SAVED_PRINT, ERROR_SAVE_RECEIVING_FAILED, ERROR_SAVING_RECEIVING,
  ERROR_FETCH_INDENT_DETAILS, RECEIVED_QUANTITY_EXCEEDS_ISSUED, REJECT_QUANTITY_EXCEEDS_ISSUED,
  VALIDATION_ERROR_HEADER, ITEM_RECEIVING_REPORT_TITLE, ITEM_RECEIVING_REPORT_FILENAME
} from "../../../config/constants";

const ItemReceivingMainScreen = () => {
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

  // Fetch indents headers for receiving (NEW API)
  const fetchIndentHeaders = async () => {
    try {
      setLoading(true);

      const fromDeptId = sessionStorage.getItem("departmentId") || localStorage.getItem("departmentId");

      if (!fromDeptId) {
        showPopup(ERROR_DEPARTMENT_ID_NOT_FOUND, "error");
        return;
      }

      let url = `${GET_INDENT_HEADERS_FOR_RECEIVING}`; // Updated API endpoint
      const params = new URLSearchParams();

      params.append("fromDeptId", fromDeptId);
      if (fromDate) params.append("fromDate", fromDate);
      if (toDate) params.append("toDate", toDate);

      url += `?${params.toString()}`;

      console.log("Fetching indent headers from URL:", url);

      const response = await getRequest(url);
      console.log("Indent Headers API Full Response:", response);

      let data = [];
      if (response && response.response && Array.isArray(response.response)) {
        data = response.response;
      } else if (response && Array.isArray(response)) {
        data = response;
      } else {
        console.warn("Unexpected response structure, using empty array:", response);
        data = [];
      }

      console.log("Processed indent headers data:", data);
      setIndentHeaders(data);
      setFilteredIndentHeaders(data);

    } catch (err) {
      console.error("Error fetching indent headers:", err);
      showPopup(ERROR_FETCH_INDENTS, "error");
      setIndentHeaders([]);
      setFilteredIndentHeaders([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch indent details when row is clicked (NEW API)
  const fetchIndentDetails = async (indentMId) => {
    try {
      setLoadingDetails(true); // Enable loading state for details
      
      const url = `${GET_INDENT_DETAILS_FOR_RECEIVING}/${indentMId}`;
      console.log("Fetching indent details from URL:", url);

      const response = await getRequest(url);
      console.log("Indent Details API Response:", response);

      let items = [];
      if (response && response.response && Array.isArray(response.response)) {
        items = response.response;
      } else if (response && Array.isArray(response)) {
        items = response;
      } else {
        console.warn("Unexpected details response structure, using empty array:", response);
        items = [];
      }

      // Transform API response items to match frontend structure
      const transformedItems = items.map((item, index) => ({
        id: `${item.indentTId}-${index}`,
        indentTId: item.indentTId,
        itemId: item.itemId,
        drugCode: item.pvmsNo,
        drugName: item.itemName,
        apu: item.unitAuName,
        batchNo: item.batchNo || "N/A",
        dom: item.mfgDate || "",
        doe: item.expDate || "",
        qtyDemanded: item.qtyDemanded || 0,
        qtyIssued: item.qtyIssued || 0,
        qtyReceived: item.qtyIssued || 0, // Default to issued quantity
        qtyReject: 0,
        previousReceivedQty: item.previousReceivedQty || 0,
        batchstock: 0,
        manufacturerName: item.manufacturerName || "",
        brandName: item.brandName || ""
      }));

      console.log("Transformed receiving items:", transformedItems);
      setReceivingItems(transformedItems);

    } catch (err) {
      console.error("Error fetching indent details:", err);
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
    console.log("Selecting record for receiving:", record);
    setSelectedRecord(record);
    setCurrentView("detail");
    
    // Fetch details using the new API
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

      console.log("Saving receiving payload:", payload);

      const response = await postRequest(SAVE_INDENT_RECEIVING, payload);

      console.log("Save response:", response);

      if (response && response.status === 200) {
        const responseData = response.response || {};
        let message = responseData.message || "Receiving saved successfully!";

        if (responseData.returnCreated) {
          message += " " + (responseData.returnMessage || "Return created for rejected items.");
        }

        console.log("Response after succesfully receive:", response);
        const receiveMId = response.response.receiveMId;
        
        showConfirmationPopup(
          SUCCESS_RECEIVING_SAVED_PRINT,
          "success",
          () => {
            navigate('/ViewDownloadReport', {
              state: {
                reportUrl: `${RECEIVING_REPORT_URL}?${REQUEST_PARAM_RECEIVED_M_ID}=${receiveMId}`,
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
      console.error("Error saving receiving:", error);
      
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
                <h4 className="card-title p-2 mb-0 fw-bold">Item Receiving</h4>
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
              <h4 className="card-title p-2 mb-0 fw-bold">Item Receiving Main Screen</h4>
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

export default ItemReceivingMainScreen;