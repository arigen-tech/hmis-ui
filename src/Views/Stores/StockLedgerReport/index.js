import { useState, useEffect } from "react";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import Popup from "../../../Components/popup";
import PdfViewer from "../../../Components/PdfViewModel/PdfViewer";

const ItemStockLedgerReport = () => {
  const [itemName, setItemName] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [isItemDropdownVisible, setItemDropdownVisible] = useState(false);
  const [batchNo, setBatchNo] = useState("");
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchOptions, setBatchOptions] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [popupMessage, setPopupMessage] = useState(null);
  const [reportData, setReportData] = useState([]);
  
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isViewLoading, setIsViewLoading] = useState(false);
  const [isPrintLoading, setIsPrintLoading] = useState(false);

  const itemOptions = [
    { id: 1, name: "Paracetamol 500mg", code: "MED001" },
    { id: 2, name: "Amoxicillin 250mg", code: "MED002" },
    { id: 3, name: "Ibuprofen 400mg", code: "MED003" },
    { id: 4, name: "Insulin Syringe 1ml", code: "SUP001" },
    { id: 5, name: "Surgical Gloves Medium", code: "SUP002" },
    { id: 6, name: "Gauze Bandage 10cm", code: "SUP003" },
    { id: 7, name: "Saline Solution 500ml", code: "FLU001" },
    { id: 8, name: "Vitamin C 1000mg", code: "MED004" },
    { id: 9, name: "Antiseptic Solution", code: "SUP004" },
    { id: 10, name: "Cotton Roll 100g", code: "SUP005" }
  ];

  const allBatchOptions = [
    { id: 1, batchNo: "BATCH-2024-001", itemId: 1 },
    { id: 2, batchNo: "BATCH-2024-002", itemId: 1 },
    { id: 3, batchNo: "BATCH-2024-003", itemId: 2 },
    { id: 4, batchNo: "BATCH-2024-004", itemId: 3 },
    { id: 5, batchNo: "BATCH-2025-001", itemId: 1 },
    { id: 6, batchNo: "BATCH-2025-002", itemId: 4 },
    { id: 7, batchNo: "BATCH-2025-003", itemId: 5 },
    { id: 8, batchNo: "BATCH-2025-004", itemId: 6 }
  ];

  const sampleReportData = [
    {
      id: 1,
      date: "01-Jan-2025",
      transactionType: "OPENING",
      referenceNo: "—",
      transactionReason: "Opening Balance",
      qtyBefore: 0,
      qtyIn: 500,
      qtyOut: 0,
      qtyAfter: 500,
      remarks: "Opening stock"
    },
    {
      id: 2,
      date: "05-Jan-2025",
      transactionType: "GRN",
      referenceNo: "GRN-10235",
      transactionReason: "Supplier Receipt",
      qtyBefore: 500,
      qtyIn: 300,
      qtyOut: 0,
      qtyAfter: 800,
      remarks: "ABC Medical Supplies"
    },
    {
      id: 3,
      date: "10-Jan-2025",
      transactionType: "ISSUE",
      referenceNo: "ISS-4587",
      transactionReason: "OPD",
      qtyBefore: 800,
      qtyIn: 0,
      qtyOut: 120,
      qtyAfter: 680,
      remarks: "OPD consumption"
    },
    {
      id: 4,
      date: "15-Jan-2025",
      transactionType: "ISSUE",
      referenceNo: "ISS-4621",
      transactionReason: "Emergency",
      qtyBefore: 680,
      qtyIn: 0,
      qtyOut: 80,
      qtyAfter: 600,
      remarks: "Emergency usage"
    },
    {
      id: 5,
      date: "20-Jan-2025",
      transactionType: "RETURN",
      referenceNo: "RET-118",
      transactionReason: "Ward Return",
      qtyBefore: 600,
      qtyIn: 20,
      qtyOut: 0,
      qtyAfter: 620,
      remarks: "Unused items"
    },
    {
      id: 6,
      date: "25-Jan-2025",
      transactionType: "ADJUSTMENT",
      referenceNo: "ADJ-77",
      transactionReason: "Damage",
      qtyBefore: 620,
      qtyIn: 0,
      qtyOut: 10,
      qtyAfter: 610,
      remarks: "Broken packets"
    },
    {
      id: 7,
      date: "30-Jan-2025",
      transactionType: "GRN",
      referenceNo: "GRN-10240",
      transactionReason: "Supplier Receipt",
      qtyBefore: 610,
      qtyIn: 200,
      qtyOut: 0,
      qtyAfter: 810,
      remarks: "XYZ Medical Supplies"
    },
    {
      id: 8,
      date: "02-Feb-2025",
      transactionType: "ISSUE",
      referenceNo: "ISS-4689",
      transactionReason: "IPD",
      qtyBefore: 810,
      qtyIn: 0,
      qtyOut: 150,
      qtyAfter: 660,
      remarks: "IPD Ward 5"
    }
  ];

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
      },
    });
  };

  const handleItemNameChange = (e) => {
    setItemName(e.target.value);
    setItemDropdownVisible(true);
  };

  const handleItemSelect = (item) => {
    setItemName(item.name);
    setSelectedItem(item);
    setItemDropdownVisible(false);
    
    const filteredBatches = allBatchOptions.filter(batch => batch.itemId === item.id);
    setBatchOptions(filteredBatches);
    
    if (filteredBatches.length > 0) {
      setBatchNo(filteredBatches[0].batchNo);
      setSelectedBatch(filteredBatches[0]);
    } else {
      setBatchNo("");
      setSelectedBatch(null);
    }
  };

  const handleBatchChange = (e) => {
    const selectedBatchValue = e.target.value;
    const batch = batchOptions.find(b => b.batchNo === selectedBatchValue);
    setBatchNo(selectedBatchValue);
    setSelectedBatch(batch);
  };

  const validateItem = () => {
    if (!itemName.trim() || !selectedItem) {
      showPopup("Please select an item", "warning");
      return false;
    }
    return true;
  };

  const fetchStockMovementReport = async () => {
    try {
      setIsGenerating(true);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mappedData = sampleReportData.map(item => ({
        id: item.id,
        date: item.date,
        transactionType: item.transactionType,
        referenceNo: item.referenceNo,
        transactionReason: item.transactionReason,
        qtyBefore: item.qtyBefore,
        qtyIn: item.qtyIn,
        qtyOut: item.qtyOut,
        qtyAfter: item.qtyAfter,
        remarks: item.remarks
      }));
      
      setReportData(mappedData);
      setShowReport(true);
      
    } catch (error) {
      console.error("Error fetching stock movement report:", error);
      showPopup("Failed to fetch stock movement report", "error");
      setReportData([]);
      setShowReport(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePdfReport = async (flag = "D") => {
    if (!validateItem()) return;

    if (flag === "D") {
      setIsViewLoading(true);
    } else if (flag === "P") {
      setIsPrintLoading(true);
    }
    
    setPdfUrl(null);

    try {
      const params = new URLSearchParams();
      params.append('flag', flag);
      
      if (selectedItem?.id) {
        params.append('itemId', selectedItem.id);
      }
      if (batchNo) {
        params.append('batchNo', batchNo);
      }

      const url = `/reports/stockMovementReport?${params.toString()}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/pdf",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to generate PDF: ${response.statusText}`);
      }

      if (flag === "D") {
        const blob = await response.blob();
        const fileURL = window.URL.createObjectURL(blob);
        setPdfUrl(fileURL);
      } else if (flag === "P") {
        const blob = await response.blob();
        const fileURL = window.URL.createObjectURL(blob);
        const printWindow = window.open(fileURL);
        printWindow.onload = () => {
          printWindow.print();
        };
      }

    } catch (error) {
      console.error("Error generating PDF", error);
      showPopup("Failed to generate report", "error");
    } finally {
      if (flag === "D") {
        setIsViewLoading(false);
      } else if (flag === "P") {
        setIsPrintLoading(false);
      }
    }
  };

  const handleSearch = () => {
    if (!validateItem()) return;
    
    fetchStockMovementReport();
    setCurrentPage(1);
  };

  const handleViewReport = () => {
    generatePdfReport("D");
  };

  const handlePrintReport = () => {
    generatePdfReport("P");
  };

  const handleReset = () => {
    setItemName("");
    setSelectedItem(null);
    setBatchNo("");
    setSelectedBatch(null);
    setBatchOptions([]);
    setShowReport(false);
    setReportData([]);
    setCurrentPage(1);
    setPdfUrl(null);
  };

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = reportData.slice(indexOfFirst, indexOfLast);

  return (
    <div className="content-wrapper">
      {popupMessage && (
        <Popup
          message={popupMessage.message}
          type={popupMessage.type}
          onClose={popupMessage.onClose}
        />
      )}

      {pdfUrl && (
        <PdfViewer
          pdfUrl={pdfUrl}
          onClose={() => {
            setPdfUrl(null);
          }}
          name={`Stock Movement Report - ${selectedItem?.name || 'Item'}`}
        />
      )}

      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">Item Stock Movement History</h4>
            </div>
            <div className="card-body">
              <div className="row mb-4">
                <div className="form-group col-md-6 position-relative">
                  <label className="form-label fw-bold">Item Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control mt-1"
                    placeholder="Type item name or code..."
                    value={itemName}
                    onChange={handleItemNameChange}
                    onFocus={() => setItemDropdownVisible(true)}
                    onBlur={() => setTimeout(() => setItemDropdownVisible(false), 200)}
                    autoComplete="off"
                  />
                  {isItemDropdownVisible && itemName && (
                    <ul className="list-group position-absolute w-100 mt-1" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                      {itemOptions
                        .filter((item) => 
                          item.name.toLowerCase().includes(itemName.toLowerCase()) ||
                          item.code.toLowerCase().includes(itemName.toLowerCase())
                        )
                        .map((item) => (
                          <li
                            key={item.id}
                            className="list-group-item list-group-item-action"
                            onClick={() => handleItemSelect(item)}
                          >
                            <div className="fw-bold">{item.name}</div>
                            <small className="text-muted">Code: {item.code}</small>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>

                <div className="col-md-6 mt-1">
                  <label className="form-label fw-bold">Batch No</label>
                  <select 
                    className="form-select" 
                    value={batchNo} 
                    onChange={handleBatchChange}
                    disabled={!selectedItem || batchOptions.length === 0}
                  >
                    <option value="">All Batches</option>
                    {batchOptions.map((batch) => (
                      <option key={batch.id} value={batch.batchNo}>
                        {batch.batchNo}
                      </option>
                    ))}
                  </select>
                  {selectedItem && batchOptions.length === 0 && (
                    <small className="text-muted">No batches available for this item</small>
                  )}
                </div>
              </div>

              <div className="row">
                <div className="col-12 d-flex justify-content-between">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSearch}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Searching...
                      </>
                    ) : (
                      "Search"
                    )}
                  </button>
                  
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={handleViewReport}
                      disabled={isGenerating || isViewLoading || !itemName}
                    >
                      {isViewLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Generating...
                        </>
                      ) : (
                        "View Report"
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-warning"
                      onClick={handlePrintReport}
                      disabled={isGenerating || isPrintLoading || !itemName}
                    >
                      {isPrintLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Printing...
                        </>
                      ) : (
                        "Print Report"
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleReset}
                      disabled={isGenerating}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              {isGenerating && (
                <div className="text-center py-4">
                  <LoadingScreen />
                </div>
              )}

              {!isGenerating && showReport && (
                <div className="row mt-4">
                  <div className="col-12">
                    <div className="card">
                      <div className="card-header">
                        <h5 className="card-title mb-0">
                          Stock Ledger Report 
                        </h5>
                      </div>
                      <div className="card-body">
                        <div className="table-responsive">
                          <table className="table table-bordered table-hover">
                            <thead >
                              <tr>
                                <th>Date</th>
                                <th>Transaction Type</th>
                                <th>Reference No</th>
                                <th>Transaction Reason / Source</th>
                                <th>Qty Before</th>
                                <th>Qty In</th>
                                <th>Qty Out</th>
                                <th>Qty After</th>
                                <th>Remarks</th>
                              </tr>
                            </thead>
                            <tbody>
                              {reportData.length > 0 ? (
                                currentItems.map((row, index) => (
                                  <tr key={index}>
                                    <td>{row.date}</td>
                                    <td>{row.transactionType}</td>
                                    <td>{row.referenceNo}</td>
                                    <td>{row.transactionReason}</td>
                                    <td className="text-end">{row.qtyBefore}</td>
                                    <td className="text-end ">{row.qtyIn}</td>
                                    <td className="text-end ">{row.qtyOut}</td>
                                    <td className="text-end ">{row.qtyAfter}</td>
                                    <td>{row.remarks}</td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan="9" className="text-center py-4">
                                    No Stock Movement Records Found
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                        
                        {reportData.length > 0 && (
                          <Pagination
                            totalItems={reportData.length}
                            itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                            currentPage={currentPage}
                            onPageChange={setCurrentPage}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemStockLedgerReport;