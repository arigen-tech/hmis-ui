import { useState, useEffect, useRef } from "react"
import Popup from "../../../Components/popup"
import './StockStatusReport.css';
import { getRequest, fetchPdfReportForViewAndPrint } from "../../../service/apiService";
import { formatDateForDisplay } from "../../../utils/dateUtils";
import { ALL_REPORTS, MAS_ITEM_SECTION, MAS_ITEM_CLASS, OPEN_BALANCE, INVENTORY, GET_ALL_ITEM_SECTIONS, GET_ITEM_CLASS_BY_SECTION, GET_ALL_STOCKS, STOCK_REPORT_SUMMARY_URL, STOCK_REPORT_DETAIL_URL, GET_ALL_ITEMS_BY_NAME, REQUEST_PARAM_HOSPITAL_ID, REQUEST_PARAM_DEPARTMENT_ID, REQUEST_PARAM_SECTION_ID, REQUEST_PARAM_ITEM_ID, REQUEST_PARAM_KEYWORD, REQUEST_PARAM_PAGE, REQUEST_PARAM_SIZE, REQUEST_PARAM_TYPE, REQUEST_PARAM_ITEM_CLASS_ID, STATUS_P, STATUS_D } from "../../../config/apiConfig";
import PdfViewer from "../../../Components/PdfViewModel/PdfViewer";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import {
  REPORT_GEN_FAILED_ERR_MSG,
  PRINT_FAILED_ERR_MSG,
  GENERATE_REPORT_FIRST_ERR_MSG
} from "../../../config/constants";

const StockStatusReport = () => {
  const [sections, setSections] = useState([])
  const [classes, setClasses] = useState([])
  const [stocks, setStocks] = useState([])
  const [loading, setLoading] = useState(true)
  const departmentId = localStorage.getItem("departmentId") || sessionStorage.getItem("departmentId");
  const hospitalId = localStorage.getItem("hospitalId") || sessionStorage.getItem("hospitalId");
  const [currentItemId, setCurrentItemId] = useState(null);
  const [itemOptions, setItemOptions] = useState([]);
  const [activeItemDropdown, setActiveItemDropdown] = useState(false);
  const [isSearchingItem, setIsSearchingItem] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownClickedRef = useRef(false);
  const debounceTimeoutRef = useRef(null);
  const dropdownListRef = useRef(null);

  // Infinite scroll states for dropdown
  const [dropdownPage, setDropdownPage] = useState(0);
  const [dropdownHasMore, setDropdownHasMore] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [currentSearchKeyword, setCurrentSearchKeyword] = useState("");
  const [currentSearchSection, setCurrentSearchSection] = useState("");

  // PDF handling states
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const [filters, setFilters] = useState({
    class: "All",
    section: "All",
    itemSearch: "",
  })

  const [reportType, setReportType] = useState("summary")
  const [popupMessage, setPopupMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [reportGenerated, setReportGenerated] = useState(false);
  const itemSearchInputRef = useRef(null)

  useEffect(() => {
    fetchItemSection();
  }, []);

  const fetchItemSection = async () => {
    try {
      const data = await getRequest(GET_ALL_ITEM_SECTIONS);
      if (data.status === 200 && Array.isArray(data.response)) {
        setSections(data.response);
      } else {
        setSections([]);
      }
    } catch (error) {
      console.error("Error fetching Store Section data:", error);
    }
  };

  const fetchItemClassData = async (sectionId) => {
    try {
      const data = await getRequest(`${GET_ITEM_CLASS_BY_SECTION}/${sectionId}`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setClasses(data.response);
      } else {
        console.error("Unexpected API response format:", data);
        setClasses([]);
      }
    } catch (error) {
      console.error("Error fetching Service Category data:", error);
    }
  };

  // Search items with pagination support
  const searchItems = async (searchValue, sectionIdValue, page = 0, append = false) => {
    if (!searchValue || searchValue.trim() === "") {
      setItemOptions([]);
      setDropdownHasMore(false);
      return;
    }

    if (page === 0) {
      setIsSearchingItem(true);
    } else {
      setIsFetchingMore(true);
    }

    try {
      const apiSectionId = (sectionIdValue && sectionIdValue !== "All") ? sectionIdValue : null;
      const url = `${GET_ALL_ITEMS_BY_NAME}?${REQUEST_PARAM_SECTION_ID}=${apiSectionId || ''}&${REQUEST_PARAM_KEYWORD}=${encodeURIComponent(searchValue)}&${REQUEST_PARAM_PAGE}=${page}&${REQUEST_PARAM_SIZE}=10`;
      const response = await getRequest(url);

      if (response && response.status === 200) {
        let items = [];
        let isLast = true;

        if (response.response && response.response.content && Array.isArray(response.response.content)) {
          items = response.response.content;
          isLast = response.response.last;
        } else if (response.content && Array.isArray(response.content)) {
          items = response.content;
        } else if (response.response && Array.isArray(response.response)) {
          items = response.response;
        }

        const mappedItems = items.map(item => ({
          id: item.itemId,
          itemId: item.itemId,
          code: item.pvmsNo,
          itemCode: item.pvmsNo,
          name: item.nomenclature,
          itemName: item.nomenclature
        }));

        // append for scroll-triggered fetch, replace for fresh search
        setItemOptions(prev => append ? [...prev, ...mappedItems] : mappedItems);
        setDropdownHasMore(!isLast);
        setDropdownPage(page);
      } else {
        if (!append) setItemOptions([]);
        setDropdownHasMore(false);
      }
    } catch (err) {
      console.error("Error searching items:", err);
      if (!append) setItemOptions([]);
    } finally {
      setIsSearchingItem(false);
      setIsFetchingMore(false);
    }
  };

  const handleItemSearchChange = (value, sectionIdValue) => {
    setSearchTerm(value);
    setCurrentItemId(null);
    setCurrentSearchKeyword(value);
    setCurrentSearchSection(sectionIdValue);

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      searchItems(value, sectionIdValue, 0, false);
    }, 300);
  };

  // Infinite scroll handler for dropdown
  const handleDropdownScroll = (e) => {
    const el = e.target;
    const nearBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 20;

    if (nearBottom && dropdownHasMore && !isFetchingMore && !isSearchingItem) {
      searchItems(currentSearchKeyword, currentSearchSection, dropdownPage + 1, true);
    }
  };

  const handleFilterChange = (e) => {
    const { id, value } = e.target;

    setFilters((prevFilters) => ({
      ...prevFilters,
      [id]: value,
      ...(id === "section" ? { class: "All" } : {}),
    }));

    setCurrentPage(1);

    if (id === "section") {
      setCurrentItemId(null);
      setSearchTerm("");
      setItemOptions([]);
      setDropdownPage(0);
      setDropdownHasMore(false);
      setCurrentSearchKeyword("");
      setCurrentSearchSection(value);
      fetchItemClassData(value);
    }
  };

  const handleReset = () => {
    setFilters({
      class: "All",
      section: "All",
      itemSearch: "",
    });
    setCurrentItemId(null);
    setSearchTerm("");
    setItemOptions([]);
    setStocks([]);
    setReportGenerated(false);
    setCurrentPage(1);
    setActiveItemDropdown(false);
    setDropdownPage(0);
    setDropdownHasMore(false);
    setCurrentSearchKeyword("");
    setCurrentSearchSection("");
  };

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null)
      },
    })
  }

  const handleGenerateReport = () => {
    setLoading(true);
    setIsSearching(true);

    const fetchStoreReportData = async () => {
      try {
        const sectionId = filters.section !== "All" ? filters.section : null;
        const classId = filters.class !== "All" ? filters.class : null;
        const itemId = currentItemId;

        let url = `${GET_ALL_STOCKS}?${REQUEST_PARAM_TYPE}=${reportType}&${REQUEST_PARAM_HOSPITAL_ID}=${hospitalId}&${REQUEST_PARAM_DEPARTMENT_ID}=${departmentId}`;

        if (sectionId) url += `&${REQUEST_PARAM_SECTION_ID}=${sectionId}`;
        if (classId) url += `&${REQUEST_PARAM_ITEM_CLASS_ID}=${classId}`;
        if (itemId) url += `&${REQUEST_PARAM_ITEM_ID}=${itemId}`;

        const data = await getRequest(url);
        if (data.status === 200 && Array.isArray(data.response)) {
          setStocks(data.response);
          setReportGenerated(true);
        } else {
          console.error("Unexpected API response format:", data);
          setStocks([]);
        }
      } catch (error) {
        console.error("Error fetching Store Report data:", error);
      } finally {
        setIsSearching(false);
        setLoading(false);
      }
    };

    fetchStoreReportData();
  };

  // View/Download (flag="d")
  const handleViewDownload = async () => {
    if (stocks.length === 0) {
      showPopup(GENERATE_REPORT_FIRST_ERR_MSG, "error");
      return;
    }

    setIsGeneratingPDF(true);
    setPdfUrl(null);

    try {
      const sectionId = filters.section !== "All" ? filters.section : 0;
      const classId = filters.class !== "All" ? filters.class : 0;
      const itemId = currentItemId || 0;

      const summaryUrl = `${STOCK_REPORT_SUMMARY_URL}?${REQUEST_PARAM_HOSPITAL_ID}=${hospitalId}&${REQUEST_PARAM_DEPARTMENT_ID}=${departmentId}&${REQUEST_PARAM_ITEM_CLASS_ID}=${classId}&${REQUEST_PARAM_SECTION_ID}=${sectionId}&${REQUEST_PARAM_ITEM_ID}=${itemId}`;
      const detailsUrl = `${STOCK_REPORT_DETAIL_URL}?${REQUEST_PARAM_HOSPITAL_ID}=${hospitalId}&${REQUEST_PARAM_DEPARTMENT_ID}=${departmentId}&${REQUEST_PARAM_ITEM_CLASS_ID}=${classId}&${REQUEST_PARAM_SECTION_ID}=${sectionId}&${REQUEST_PARAM_ITEM_ID}=${itemId}`;

      const url = reportType === "summary" ? summaryUrl : detailsUrl;

      const blob = await fetchPdfReportForViewAndPrint(url, STATUS_D);
      const fileURL = window.URL.createObjectURL(blob);
      setPdfUrl(fileURL);

    } catch (error) {
      console.error("Error generating PDF", error);
      showPopup(REPORT_GEN_FAILED_ERR_MSG, "error");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Print (flag="p")
  const handlePrint = async () => {
    if (stocks.length === 0) {
      showPopup(GENERATE_REPORT_FIRST_ERR_MSG, "error");
      return;
    }

    setIsPrinting(true);

    try {
      const sectionId = filters.section !== "All" ? filters.section : 0;
      const classId = filters.class !== "All" ? filters.class : 0;
      const itemId = currentItemId || 0;

      const summaryUrl = `${STOCK_REPORT_SUMMARY_URL}?${REQUEST_PARAM_HOSPITAL_ID}=${hospitalId}&${REQUEST_PARAM_DEPARTMENT_ID}=${departmentId}&${REQUEST_PARAM_ITEM_CLASS_ID}=${classId}&${REQUEST_PARAM_SECTION_ID}=${sectionId}&${REQUEST_PARAM_ITEM_ID}=${itemId}`;
      const detailsUrl = `${STOCK_REPORT_DETAIL_URL}?${REQUEST_PARAM_HOSPITAL_ID}=${hospitalId}&${REQUEST_PARAM_DEPARTMENT_ID}=${departmentId}&${REQUEST_PARAM_ITEM_CLASS_ID}=${classId}&${REQUEST_PARAM_SECTION_ID}=${sectionId}&${REQUEST_PARAM_ITEM_ID}=${itemId}`;

      const url = reportType === "summary" ? summaryUrl : detailsUrl;

      await fetchPdfReportForViewAndPrint(url, STATUS_P);

    } catch (error) {
      console.error("Error printing report", error);
      showPopup(PRINT_FAILED_ERR_MSG, "error");
    } finally {
      setIsPrinting(false);
    }
  };

  const filteredStockList = stocks;
  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredStockList.slice(indexOfFirst, indexOfLast);

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title mb-0">
                Stock Status Report
              </h4>
            </div>
            <div className="card-body">

              {/* Filters Section */}
              <div className="row mb-4">
                <div className="col-md-4">
                  <label className="form-label">Section</label>
                  <select
                    className="form-select"
                    id="section"
                    value={filters.section}
                    onChange={handleFilterChange}
                  >
                    <option value="All">All</option>
                    {sections.map((sec) => (
                      <option key={sec.sectionId} value={sec.sectionId}>
                        {sec.sectionName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-4 mb-2">
                  <label className="form-label">Class</label>
                  <select
                    className="form-select"
                    id="class"
                    value={filters.class}
                    onChange={handleFilterChange}
                    disabled={filters.section === "All"}
                  >
                    <option value="All">All</option>
                    {classes.map((cls) => (
                      <option key={cls.itemClassId} value={cls.itemClassId}>
                        {cls.itemClassName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-4">
                  <label className="form-label">Item Code/Name</label>
                  <div style={{ position: "relative" }}>
                    <input
                      ref={itemSearchInputRef}
                      type="text"
                      className="form-control"
                      value={searchTerm}
                      onChange={(e) => {
                        const value = e.target.value;
                        setSearchTerm(value);
                        setFilters((prev) => ({ ...prev, itemSearch: value }));
                        setActiveItemDropdown(true);
                        const sectionId = filters.section;
                        handleItemSearchChange(value, sectionId);
                      }}
                      placeholder="Search by Item Code or Name..."
                      autoComplete="off"
                      disabled={filters.section === "All"}
                      onFocus={() => setActiveItemDropdown(true)}
                      onBlur={() => {
                        setTimeout(() => {
                          if (!dropdownClickedRef.current) {
                            setActiveItemDropdown(false);
                          }
                          dropdownClickedRef.current = false;
                        }, 150);
                      }}
                    />

                    {/* Spinner inside input while fetching first page */}
                    {isSearchingItem && (
                      <div style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)"
                      }}>
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                      </div>
                    )}

                    {/* Dropdown list with infinite scroll */}
                    {activeItemDropdown && itemOptions.length > 0 && (
                      <ul
                        ref={dropdownListRef}
                        className="list-group"
                        onScroll={handleDropdownScroll}
                        style={{
                          position: "absolute",
                          zIndex: 9999,
                          maxHeight: 200,
                          overflowY: "auto",
                          width: "100%",
                          top: "100%",
                          left: 0,
                          backgroundColor: "white",
                          border: "1px solid #dee2e6",
                          borderRadius: "0.375rem",
                          boxShadow: "0 0.5rem 1rem rgba(0, 0, 0, 0.15)",
                          marginTop: "2px"
                        }}
                      >
                        {itemOptions.map((opt) => (
                          <li
                            key={opt.itemId || opt.id}
                            className="list-group-item list-group-item-action"
                            style={{ cursor: "pointer" }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              dropdownClickedRef.current = true;
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              const displayText = (opt.itemCode || opt.code)
                                ? `${opt.itemCode || opt.code} - ${opt.itemName || opt.name}`
                                : opt.itemName || opt.name;
                              setSearchTerm(displayText);
                              setCurrentItemId(opt.itemId || opt.id);
                              setFilters((prev) => ({ ...prev, itemSearch: displayText }));
                              setActiveItemDropdown(false);
                              setItemOptions([]);
                              dropdownClickedRef.current = false;
                            }}
                          >
                            {opt.code || opt.itemCode} - {opt.name || opt.itemName}
                          </li>
                        ))}

                        {/* Load-more spinner at bottom of list */}
                        {isFetchingMore && (
                          <li className="list-group-item text-center py-2">
                            <span className="spinner-border spinner-border-sm" role="status"></span>
                            <span className="ms-2 text-muted" style={{ fontSize: "0.85rem" }}>
                              Loading more...
                            </span>
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              {/* Report Type Selection + Action Buttons */}
              <div className="row mb-4">
                <div className="col-md-6">
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="reportType"
                      id="summary"
                      value="summary"
                      checked={reportType === "summary"}
                      onChange={(e) => {
                        setReportType(e.target.value);
                        setReportGenerated(false);
                      }}
                    />
                    <label className="form-check-label" htmlFor="summary">
                      Summary
                    </label>
                  </div>
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="reportType"
                      id="details"
                      value="details"
                      checked={reportType === "details"}
                      onChange={(e) => {
                        setReportType(e.target.value);
                        setReportGenerated(false);
                      }}
                    />
                    <label className="form-check-label" htmlFor="details">
                      Detail
                    </label>
                  </div>
                </div>

                <div className="col-md-6 d-flex justify-content-end align-items-end">
                  <button
                    type="button"
                    className="btn btn-primary me-2"
                    onClick={handleGenerateReport}
                    disabled={isSearching}
                  >
                    {isSearching ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Searching...
                      </>
                    ) : "Search"}
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary me-2"
                    onClick={handleReset}
                  >
                    Reset
                  </button>

                  <button
                    type="button"
                    className="btn btn-success me-2"
                    onClick={handleViewDownload}
                    disabled={isGeneratingPDF || stocks.length === 0}
                  >
                    {isGeneratingPDF ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Generating...
                      </>
                    ) : (
                      <><i className="fa fa-eye me-2"></i> VIEW/DOWNLOAD</>
                    )}
                  </button>

                  <button
                    type="button"
                    className="btn btn-warning"
                    onClick={handlePrint}
                    disabled={isPrinting || stocks.length === 0}
                  >
                    {isPrinting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Printing...
                      </>
                    ) : (
                      <><i className="fa fa-print me-2"></i> PRINT</>
                    )}
                  </button>
                </div>
              </div>

              {/* Table Section */}
              {reportGenerated && (
                <div className="table-responsive packagelist">
                  {reportType === "summary" ? (
                    <table className="table table-bordered table-hover align-middle">
                      <thead style={{ backgroundColor: "#b0c4de" }}>
                        <tr>
                          <th>S.No.</th>
                          <th>Drug Code</th>
                          <th>Drug Name</th>
                          <th>A/U</th>
                          <th>Stock Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((item, index) => (
                            <tr key={item.stockId}>
                              <td>{(currentPage - 1) * DEFAULT_ITEMS_PER_PAGE + index + 1}</td>
                              <td>{item.itemCode}</td>
                              <td>{item.itemName}</td>
                              <td>{item.unitAu}</td>
                              <td>{item.closingQty}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="text-center text-gray-500 py-4">
                              No records found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  ) : (
                    <table className="table table-bordered table-hover align-middle">
                      <thead style={{ backgroundColor: "#b0c4de" }}>
                        <tr>
                          <th>S.No.</th>
                          <th>Drug Code</th>
                          <th>Drug Name</th>
                          <th>A/U</th>
                          <th>Batch No.</th>
                          <th>DOM</th>
                          <th>DOE</th>
                          <th>Stock Qty</th>
                          <th>Medicine Source</th>
                          <th>Manufacturer</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems?.length > 0 ? (
                          currentItems.map((item, index) => (
                            <tr key={item.stockId}>
                              <td>{(currentPage - 1) * DEFAULT_ITEMS_PER_PAGE + index + 1}</td>
                              <td>{item.itemCode}</td>
                              <td>{item.itemName}</td>
                              <td>{item.unitAu}</td>
                              <td>{item.batchNo}</td>
                              <td>{formatDateForDisplay(item.dom)}</td>
                              <td>{formatDateForDisplay(item.doe)}</td>
                              <td>{item.closingQty}</td>
                              <td>{item.medicineSource}</td>
                              <td>{item.manufacturerName}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="10" className="text-center text-gray-500 py-4">
                              No records found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Pagination */}
              {reportGenerated && filteredStockList.length > 0 && (
                <Pagination
                  totalItems={filteredStockList.length}
                  itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PDF Viewer Modal */}
      {pdfUrl && (
        <PdfViewer
          pdfUrl={pdfUrl}
          onClose={() => setPdfUrl(null)}
          name={`Stock Status Report - ${reportType === 'summary' ? 'Summary' : 'Detail'}`}
        />
      )}

      {/* Popup Message */}
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

export default StockStatusReport