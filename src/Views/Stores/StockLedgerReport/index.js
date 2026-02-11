import { useState, useEffect, useRef } from "react";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import Popup from "../../../Components/popup";
import PdfViewer from "../../../Components/PdfViewModel/PdfViewer";
import { getRequest } from "../../../service/apiService";

const StoreStockLedgerReport = () => {
  // State for form inputs
  const [itemName, setItemName] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [batchNo, setBatchNo] = useState("");
  const [batchOptions, setBatchOptions] = useState([]);
  
  // State for pagination and search
  const [currentPage, setCurrentPage] = useState(0);
  const [reportData, setReportData] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  
  // State for PDF operations
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isViewLoading, setIsViewLoading] = useState(false);
  const [isPrintLoading, setIsPrintLoading] = useState(false);
  
  // State for item dropdown with debounce
  const [itemDropdown, setItemDropdown] = useState([]);
  const [itemSearch, setItemSearch] = useState("");
  const [itemPage, setItemPage] = useState(0);
  const [itemLastPage, setItemLastPage] = useState(true);
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  
  // State for popup messages
  const [popupMessage, setPopupMessage] = useState(null);
  
  // Refs for debounce and dropdown
  const debounceItemRef = useRef(null);
  const dropdownItemRef = useRef(null);

  // Check if both required fields are selected
  const isSearchEnabled = () => {
    return selectedItem?.itemId && batchNo?.trim() !== "";
  };

  // Fetch stock ledger report data from API
  const fetchStockLedgerReport = async (page = 0) => {
    try {
      setSearchLoading(true);
      
      const params = new URLSearchParams({
        page: page,
        size: DEFAULT_ITEMS_PER_PAGE
      });
      
      if (selectedItem?.itemId) params.append('itemId', selectedItem.itemId);
      if (batchNo) params.append('batchNo', batchNo);
      
      const response = await getRequest(`/indent/store-stock-ledger/report?${params.toString()}`);
      
      if (response?.response) {
        const mappedData = mapApiData(response.response.content);
        setReportData(mappedData);
        setTotalPages(response.response.totalPages);
        setTotalElements(response.response.totalElements);
        setShowReport(true);
      } else {
        resetReportData();
      }
    } catch (error) {
      console.error("Error fetching stock ledger report:", error);
      showPopup("Failed to fetch stock ledger report", "error");
      resetReportData();
    } finally {
      setSearchLoading(false);
    }
  };

  // Reset report data to initial state
  const resetReportData = () => {
    setReportData([]);
    setTotalPages(0);
    setTotalElements(0);
    setShowReport(true);
  };

  // Handle pagination page change
  const handlePageChange = (page) => {
    const newPage = page - 1;
    setCurrentPage(newPage);
    
    if (isSearchMode && isSearchEnabled()) {
      fetchStockLedgerReport(newPage);
    }
  };

  // Map API data to match table structure
  const mapApiData = (apiData) => {
    return apiData.map(item => ({
      id: item.ledgerId,
      date: formatDateForDisplay(item.createdDate),
      transactionType: item.txnType,
      referenceNo: item.referenceNum || "-",
      transactionReason: item.txnSource || "-",
      qtyBefore: item.qtyBefore || 0,
      qtyIn: item.qtyIn || 0,
      qtyOut: item.qtyOut || 0,
      qtyAfter: item.qtyAfter || 0,
      remarks: item.remarks
    }));
  };

  // Format date from "2026-01-28T15:34:04.336584" to "28/01/2026"
  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Fetch items from API with debounce
  const fetchItems = async (page, searchText = "") => {
    try {
      const url = `/indent/item/search?keyword=${encodeURIComponent(searchText)}&page=${page}&size=10`;
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
    }
  };

  // Fetch batches for selected item
  const fetchBatches = async (itemId) => {
    try {
      setIsBatchLoading(true);
      const url = `/indent/item/batches/${itemId}`;
      const data = await getRequest(url);

      if (data.status === 200 && data.response) {
        return data.response;
      }
      return [];
    } catch (error) {
      console.error("Error fetching batches:", error);
      showPopup("Failed to load batches", "error");
      return [];
    } finally {
      setIsBatchLoading(false);
    }
  };

  // Handle item search with debounce
  const handleItemSearch = (value) => {
    setItemSearch(value);
    setItemName(value);
    
    // Clear selections when user types
    if (!value.trim() || (selectedItem && !value.includes(selectedItem.nomenclature))) {
      setSelectedItem(null);
      setBatchOptions([]);
      setBatchNo("");
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
  const loadFirstItemPage = async () => {
    if (!itemSearch.trim()) return;
    const result = await fetchItems(0, itemSearch);
    setItemDropdown(result.list);
    setItemLastPage(result.last);
    setItemPage(0);
    setShowItemDropdown(true);
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
  const handleItemSelect = async (item) => {
    setItemName(item.nomenclature);
    setSelectedItem(item);
    setShowItemDropdown(false);
    setBatchOptions([]);
    setBatchNo("");
    
    // Fetch batches for selected item
    try {
      const batches = await fetchBatches(item.itemId);
      setBatchOptions(batches);
    } catch (error) {
      console.error("Error loading batches:", error);
    }
  };

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownItemRef.current && !dropdownItemRef.current.contains(e.target)) {
        setShowItemDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Show popup message
  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => setPopupMessage(null),
    });
  };

  // Handle search button click
  const handleSearch = () => {
    if (!isSearchEnabled()) {
      showPopup("Please select both Item and Batch", "warning");
      return;
    }
    setCurrentPage(0);
    setIsSearchMode(true);
    fetchStockLedgerReport(0);
  };

  // Generate PDF report
  const generatePdfReport = async (flag = "D") => {
    if (!isSearchEnabled()) {
      showPopup("Please select both Item and Batch", "warning");
      return;
    }

    if (flag === "D") setIsViewLoading(true);
    if (flag === "P") setIsPrintLoading(true);
    
    setPdfUrl(null);

    try {
      const params = new URLSearchParams();
      params.append('flag', flag);
      if (selectedItem?.itemId) params.append('itemId', selectedItem.itemId);
      if (batchNo) params.append('batchNo', batchNo);

      const url = `/reports/stockMovementReport?${params.toString()}`;
      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/pdf" },
      });

      if (!response.ok) throw new Error(`Failed to generate PDF: ${response.statusText}`);

      const blob = await response.blob();
      const fileURL = window.URL.createObjectURL(blob);

      if (flag === "D") {
        setPdfUrl(fileURL);
      } else if (flag === "P") {
        const printWindow = window.open(fileURL);
        printWindow.onload = () => printWindow.print();
      }
    } catch (error) {
      console.error("Error generating PDF", error);
      showPopup("Failed to generate report", "error");
    } finally {
      if (flag === "D") setIsViewLoading(false);
      if (flag === "P") setIsPrintLoading(false);
    }
  };

  // Handle view report button
  const handleViewReport = () => generatePdfReport("D");

  // Handle print report button
  const handlePrintReport = () => generatePdfReport("P");

  // Reset all form and report data
  const handleReset = () => {
    setItemName("");
    setSelectedItem(null);
    setItemSearch("");
    setItemDropdown([]);
    setBatchNo("");
    setBatchOptions([]);
    setShowReport(false);
    setReportData([]);
    setCurrentPage(0);
    setTotalPages(0);
    setTotalElements(0);
    setIsSearchMode(false);
    setPdfUrl(null);
    setShowItemDropdown(false);
  };

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
          onClose={() => setPdfUrl(null)}
          name={`Stock Ledger Report - ${selectedItem?.nomenclature || 'Item'}`}
        />
      )}

      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">Store Stock Ledger Report</h4>
            </div>
            <div className="card-body">
              {/* Search Form */}
              <div className="row mb-4">
                <div className="form-group col-md-6 position-relative" ref={dropdownItemRef}>
                  <label className="form-label fw-bold">Item Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control mt-1"
                    placeholder="Type item name or code..."
                    value={itemName}
                    onChange={(e) => handleItemSearch(e.target.value)}
                    onClick={loadFirstItemPage}
                    autoComplete="off"
                  />
                  
                  {/* Item Dropdown */}
                  {showItemDropdown && (
                    <div 
                      className="border rounded mt-1 bg-white position-absolute w-100"
                      style={{ maxHeight: "220px", zIndex: 1000, overflowY: "auto" }}
                      onScroll={(e) => {
                        if (e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight) {
                          loadMoreItems();
                        }
                      }}
                    >
                      {itemDropdown.length > 0 ? (
                        <>
                          {itemDropdown.map((item) => (
                            <div
                              key={item.itemId}
                              className="p-2 cursor-pointer hover-bg-light"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleItemSelect(item);
                              }}
                              style={{ cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}
                            >
                              <div className="fw-bold">{item.nomenclature}</div>
                              <small className="text-muted">PVMS: {item.pvmsNo}</small>
                            </div>
                          ))}
                          
                          {!itemLastPage && (
                            <div className="text-center p-2 text-primary small">
                              Scroll to load more...
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="p-2 text-muted text-center">No items found</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="col-md-6 mt-1">
                  <label className="form-label fw-bold">Batch No <span className="text-danger">*</span></label>
                  <div className="position-relative">
                    <select 
                      className="form-select" 
                      value={batchNo} 
                      onChange={(e) => setBatchNo(e.target.value)}
                      disabled={!selectedItem || isBatchLoading}
                    >
                      <option value="">--Select Batch--</option>
                      {batchOptions.length > 0 ? (
                        batchOptions.map((batch, index) => (
                          <option key={index} value={batch}>{batch}</option>
                        ))
                      ) : (
                        <option value="">No batches available</option>
                      )}
                    </select>
                    
                    {isBatchLoading && (
                      <div className="position-absolute end-0 top-50 translate-middle-y me-3">
                        <div className="spinner-border spinner-border-sm text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {selectedItem && batchOptions.length === 0 && !isBatchLoading && (
                    <small className="text-muted">No batches available for this item</small>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="row">
                <div className="col-12 d-flex justify-content-between">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSearch}
                    disabled={searchLoading || !isSearchEnabled()}
                  >
                    {searchLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Searching...
                      </>
                    ) : "Search"}
                  </button>
                  
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={handleViewReport}
                      disabled={searchLoading || isViewLoading || !isSearchEnabled()}
                    >
                      {isViewLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Generating...
                        </>
                      ) : "View Report"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-warning"
                      onClick={handlePrintReport}
                      disabled={searchLoading || isPrintLoading || !isSearchEnabled()}
                    >
                      {isPrintLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Printing...
                        </>
                      ) : "Print Report"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleReset}
                      disabled={searchLoading}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* Loading Indicator */}
              {searchLoading && (
                <div className="text-center py-4">
                  <LoadingScreen />
                </div>
              )}

              {/* Report Table */}
              {!searchLoading && showReport && (
                <div className="row mt-4">
                  <div className="col-12">
                    <div className="card">
                      <div className="card-header d-flex justify-content-between align-items-center">
                        <h5 className="card-title mb-0">
                          Store Stock Ledger Report 
                          {selectedItem && (
                            <small className="text-muted ms-2">
                              - {selectedItem.nomenclature}
                              {batchNo && ` (Batch: ${batchNo})`}
                            </small>
                          )}
                        </h5>
                        <span className="fw-bold">Total Records: {totalElements}</span>
                      </div>
                      <div className="card-body">
                        <div className="table-responsive">
                          <table className="table table-bordered table-hover">
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Transaction Type</th>
                                <th style={{ width: "120px" }}>Reference No</th>
                                <th style={{ width: "80px" }}>Transaction Reason / Source</th>
                                <th style={{ width: "50px" }}>Qty Before</th>
                                <th>Qty In</th>
                                <th>Qty Out</th>
                                <th style={{ width: "50px" }}>Qty After</th>
                                <th>Remarks</th>
                              </tr>
                            </thead>
                            <tbody>
                              {reportData.length > 0 ? (
                                reportData.map((row) => (
                                  <tr key={row.id}>
                                    <td>{row.date}</td>
                                    <td>{row.transactionType}</td>
                                    <td>{row.referenceNo}</td>
                                    <td>{row.transactionReason}</td>
                                    <td className="text-end">{row.qtyBefore}</td>
                                    <td className="text-end">{row.qtyIn}</td>
                                    <td className="text-end">{row.qtyOut}</td>
                                    <td className="text-end">{row.qtyAfter}</td>
                                    <td>{row.remarks}</td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan="9" className="text-center py-4">
                                    No Stock Ledger Records Found
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                        
                        {/* Pagination */}
                        {reportData.length > 0 && totalPages > 0 && (
                          <Pagination
                            totalItems={totalElements}
                            itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                            currentPage={currentPage + 1}
                            onPageChange={handlePageChange}
                            totalPages={totalPages}
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

export default StoreStockLedgerReport;