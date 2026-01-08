import { useEffect, useState } from "react"
import LoadingScreen from "../../../Components/Loading"
import { Store_Internal_Indent } from "../../../config/apiConfig"
import { getRequest, postRequest } from "../../../service/apiService"
import Popup from "../../../Components/popup"
import DatePicker from "../../../Components/DatePicker"
import Pagination, {DEFAULT_ITEMS_PER_PAGE} from "../../../Components/Pagination";

const ItemReceivingMainScreen = () => {
  const [indentData, setIndentData] = useState([])
  const [filteredIndentData, setFilteredIndentData] = useState([])
  const [currentView, setCurrentView] = useState("list")
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [receivingItems, setReceivingItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [popupMessage, setPopupMessage] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const itemsPerPage = 5

  // Date filters
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  const hospitalId = sessionStorage.getItem("hospitalId") || localStorage.getItem("hospitalId")
  const departmentId = sessionStorage.getItem("departmentId") || localStorage.getItem("departmentId")

  // Fetch indents for receiving
  const fetchReceivingIndents = async () => {
    try {
      setLoading(true);

      const fromDeptId = sessionStorage.getItem("departmentId") || localStorage.getItem("departmentId");

      if (!fromDeptId) {
        showPopup("Department ID not found. Please login again.", "error");
        return;
      }

      let url = `${Store_Internal_Indent}/receiving/list`;
      const params = new URLSearchParams();

      params.append("fromDeptId", fromDeptId);
      if (fromDate) params.append("fromDate", fromDate);
      if (toDate) params.append("toDate", toDate);

      url += `?${params.toString()}`;

      console.log("Fetching receiving indents from URL:", url);

      const response = await getRequest(url);
      console.log("Receiving Indents API Full Response:", response);

      let data = [];
      if (response && response.response && Array.isArray(response.response)) {
        data = response.response;
      } else if (response && Array.isArray(response)) {
        data = response;
      } else {
        console.warn("Unexpected response structure, using empty array:", response);
        data = [];
      }

      console.log("Processed receiving indents data:", data);
      setIndentData(data);
      setFilteredIndentData(data);

    } catch (err) {
      console.error("Error fetching receiving indents:", err);
      showPopup("Error fetching indents. Please try again.", "error");
      setIndentData([]);
      setFilteredIndentData([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch indents on component mount
  useEffect(() => {
    fetchReceivingIndents();
  }, []);

  const formatDate = (value) => {
    if (!value) return ""
    const d = new Date(value)
    return d.toLocaleDateString("en-GB")
  }

  const formatDateTime = (value) => {
    if (!value) return ""
    const d = new Date(value)
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

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
      setFilteredIndentData(indentData)
      setCurrentPage(1)
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

  const handleShowAll = () => {
    setFromDate("")
    setToDate("")
    setFilteredIndentData(indentData)
    setCurrentPage(1)
  }

  

  const handleRowClick = (record) => {
    console.log("Selecting record for receiving:", record);
    setSelectedRecord(record)

    // Transform API response items to match frontend structure
    const transformedItems = [];

    (record.items || []).forEach((item) => {
      const batches = item.batches || [];
      const totalRequestedQty = item.requestedQty || 0;
      const totalIssuedQty = item.issuedQty || 0;
      const previousReceivedQty = item.receivedQty || 0;

      if (batches.length === 0) {
        // If no batches, create one row with total values
        transformedItems.push({
          id: `${item.indentTId}-no-batch`,
          indentTId: item.indentTId,
          itemId: item.itemId,
          drugCode: item.pvmsNo,
          drugName: item.itemName,
          apu: item.unitAuName,
          batchNo: "N/A",
          dom: "",
          doe: "",
          qtyDemanded: totalRequestedQty,
          qtyIssued: totalIssuedQty,
          qtyReceived: totalIssuedQty,
          qtyReject: 0,
          previousReceivedQty: previousReceivedQty,
          batchstock: 0,
          manufacturerName: "",
          brandName: ""
        });
      } else {
        // Create separate row for each batch
        batches.forEach((batch, batchIndex) => {
          const batchIssuedQty = batch.batchIssuedQty || 0;

          transformedItems.push({
            id: `${item.indentTId}-batch-${batchIndex}`,
            indentTId: item.indentTId,
            itemId: item.itemId,
            drugCode: item.pvmsNo,
            drugName: item.itemName,
            apu: item.unitAuName,
            batchNo: batch.batchNo || "N/A",
            dom: batch.manufactureDate || "",
            doe: batch.expiryDate || "",
            qtyDemanded: totalRequestedQty,
            qtyIssued: batchIssuedQty,
            qtyReceived: batchIssuedQty,
            qtyReject: 0,
            previousReceivedQty: batch.batchReceivedQty || 0, // Use batchReceivedQty from API
            batchstock: batch.batchstock || 0,
            manufacturerName: batch.manufacturerName || "",
            brandName: batch.brandName || ""
          });
        });
      }
    });

    console.log("Transformed receiving items:", transformedItems);

    setReceivingItems(transformedItems)
    setCurrentView("detail")
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
    const qtyReject = updated[index].qtyReject || 0;

    // Validate received quantity - NO POPUP HERE
    if (qtyReceived < 0) {
      // Don't update if negative
      return;
    }

    // Remove the validation popup check
    updated[index] = {
      ...updated[index],
      qtyReceived: qtyReceived,
    }
    setReceivingItems(updated)
  }

  const handleQtyRejectChange = (index, value) => {
    const updated = [...receivingItems]
    const qtyReject = value === "" ? 0 : Number(value);
    const qtyIssued = updated[index].qtyIssued || 0;
    const qtyReceived = updated[index].qtyReceived || 0;

    // Validate reject quantity - NO POPUP HERE
    if (qtyReject < 0) {
      // Don't update if negative
      return;
    }

    // Remove the validation popup check
    updated[index] = {
      ...updated[index],
      qtyReject: qtyReject,
    }
    setReceivingItems(updated)
  }

  // Handle save receiving - FIXED VERSION
  const handleSaveReceiving = async () => {
    // Prevent multiple clicks
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

    // Show error popup immediately if validation fails
    if (validationErrors.length > 0) {
      showPopup(
        `Please fix the following items:\n\n${validationErrors.join("\n\n")}`,
        "warning"
      );
      // Stop execution here
      return;
    }

    // Only proceed if validation passed
    setIsSaving(true);
    setLoading(true);

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

      const response = await postRequest(`${Store_Internal_Indent}/receive/save`, payload);

      console.log("Save response:", response);

      // Check if the request was successful
      if (response && response.status === 200) {
        const responseData = response.response || {};
        let message = responseData.message || "Receiving saved successfully!";

        // Check if return was created
        if (responseData.returnCreated) {
          message += " " + (responseData.returnMessage || "Return created for rejected items.");
        }

        showPopup(message, "success");

        // Refresh the list
        setTimeout(() => {
          handleBack();
          fetchReceivingIndents();
        }, 1500);
      } else {
        showPopup(response?.message || "Failed to save receiving", "error");
        setIsSaving(false);
      }

    } catch (error) {
      console.error("Error saving receiving:", error);
      showPopup("Error saving receiving. Please try again.", "error");
      setIsSaving(false);
    } finally {
      setLoading(false);
    }
  };

  // Pagination slice
  const totalPages = Math.ceil(filteredIndentData.length / itemsPerPage) || 1
  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredIndentData.slice(indexOfFirst, indexOfLast);

 
  // Detail view
  if (currentView === "detail") {
    return (
      <div className="content-wrapper">
        {loading && <LoadingScreen />}
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
                    <input type="text" className="form-control" value={formatDateTime(selectedRecord?.indentDate)} readOnly style={{ backgroundColor: "#e9ecef" }} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold">Issue Date</label>
                    <input type="text" className="form-control" value={formatDateTime(selectedRecord?.issuedDate)} readOnly style={{ backgroundColor: "#e9ecef" }} />
                  </div>
                  <div className="col-md-4 mt-2">
                    <label className="form-label fw-bold">Issue No.</label>
                    <input type="text" className="form-control" value={selectedRecord?.issueNo || ""} readOnly style={{ backgroundColor: "#e9ecef" }} />
                  </div>
                </div>

                {/* Items table */}
                <div className="table-responsive">
                  <table className="table table-bordered align-middle text-center">
                    <thead>
                      <tr>
                        <th style={{ width: "60px" }}>S.No.</th>
                        <th style={{ minWidth: "140px" }}>Drug Code</th>
                        <th style={{ minWidth: "240px" }}>Drug Name</th>
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
                      {receivingItems.map((item, idx) => {
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
                            <td>{formatDate(item.dom)}</td>
                            <td>{formatDate(item.doe)}</td>
                            <td>{item.qtyDemanded}</td>
                            <td>{qtyIssued}</td>
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
                                style={{ width: "50px" }}
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
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSaveReceiving}
                    disabled={loading || isSaving}
                  >
                    {isSaving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : "Save Receiving"}
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
      {loading && <LoadingScreen />}
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
                  <button type="button" className="btn btn-primary" onClick={handleSearch}>
                    Search
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
                      <th>issueNo</th>
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
                        <tr key={item.indentMId} onClick={() => handleRowClick(item)} style={{ cursor: "pointer" }}>
                          <td>{item.indentNo}</td>
                          <td>{formatDate(item.indentDate)}</td>
                          <td>{item.issueNo}</td>
                          <td>{formatDate(item.issuedDate)}</td>
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

export default ItemReceivingMainScreen