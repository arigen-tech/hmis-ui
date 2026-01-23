import { useState, useEffect, useRef } from "react"
import Popup from "../../../Components/popup"
import './StockStatusReport.css';
import { getRequest, putRequest, postRequest } from "../../../service/apiService";
import { MAS_DRUG_MAS, ALL_REPORTS, MAS_ITEM_SECTION, MAS_ITEM_CLASS, OPEN_BALANCE } from "../../../config/apiConfig";
import LoadingScreen from "../../../Components/Loading";
import paths from "../../../assets/images/logoPath.jpeg";
import axios from "axios";
import PdfViewer from "../../../Components/PdfViewModel/PdfViewer"; // Add this import
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";  


const StockStatusReport = () => {
  const [sections, setSections] = useState([])
  const [classes, setClasses] = useState([])
  const [stocks, setStocks] = useState([])
  const [loading, setLoading] = useState(true)
  const departmentId = localStorage.getItem("departmentId") || sessionStorage.getItem("departmentId");
  const hospitalId = localStorage.getItem("hospitalId") || sessionStorage.getItem("hospitalId");
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  const [currentItemId, setCurrentItemId] = useState(null);
  const [drugCodeOptions, setDrugCodeOptions] = useState([]);
  const [activeDrugCodeDropdown, setActiveDrugCodeDropdown] = useState(null);
  const dropdownClickedRef = useRef(false);
  const [activeCodeDropdown, setActiveCodeDropdown] = useState(null);
  const [activeNameDropdown, setActiveNameDropdown] = useState(null);

  // Add these states for PDF handling - separate states for each button
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    fetchItemSection();
  }, []);

  const fetchItemSection = async () => {
    try {
      const data = await getRequest(`${MAS_ITEM_SECTION}/getAll/1`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setSections(data.response);
        await fetchItemClassData();
      } else {
        setSections([]);
      }
    } catch (error) {
      console.error("Error fetching Store Section data:", error);
    }
  };

  const fetchItemClassData = async (sectionId) => {
    try {
      const data = await getRequest(`${MAS_ITEM_CLASS}/getAllBySectionId/${sectionId}`);
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

  const [filters, setFilters] = useState({
    class: "All",
    section: "All",
    itemCode: "",
    itemName: "",
  })

  const [reportType, setReportType] = useState("summary")
  const [searchQuery, setSearchQuery] = useState("")
  const [popupMessage, setPopupMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const itemsPerPage = 5
  const [reportGenerated, setReportGenerated] = useState(false);
  const drugCodeInputRefs = useRef({})
  const drugNameInputRefs = useRef({})

  const handleFilterChange = (e) => {
    const { id, value } = e.target;

    setFilters((prevFilters) => ({
      ...prevFilters,
      [id]: value,
      ...(id === "section" ? { class: "All" } : {}),
    }));

    setCurrentPage(1);

    if (id === "section") {
      fetchItemClassData(value);
    }
  };

  console.log("reporttype", reportType)

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  // Filter function for both stocks and stockDt
  const filterItems = (items) => {
    return items.filter((item) => {
      const matchesSection =
        filters.section === "All" || item.sectionId === Number(filters.section);
      const matchesItemCode =
        !filters.itemCode || item.itemCode.toLowerCase().includes(filters.itemCode.toLowerCase());
      const matchesItemName =
        !filters.itemName || item.itemName.toLowerCase().includes(filters.itemName.toLowerCase());
      const matchesClass =
        filters.class === "All" || item.classId === Number(filters.class);

      return matchesSection && matchesItemCode && matchesItemName && matchesClass;
    });
  };

  const filteredStockList = filterItems(stocks);
  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE
    const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE
    const currentItems = filteredStockList.slice(indexOfFirst, indexOfLast)

  
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

    const fetchStoreReportData = async () => {
      try {
        const data = await getRequest(`${OPEN_BALANCE}/getAllStock/${reportType}/${hospitalId}/${departmentId}`);
        if (data.status === 200 && Array.isArray(data.response)) {
          setStocks(data.response);
          //showPopup("Report generated successfully!", "success");
          setReportGenerated(true);
        } else {
          console.error("Unexpected API response format:", data);
          setStocks([]);
        }
      } catch (error) {
        console.error("Error fetching Store Report data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStoreReportData();
  };

  // Function for view/download (flag="d")
  const handleViewDownload = async () => {
    if (stocks.length === 0) {
      alert("Please generate report first");
      return;
    }
    
    setIsGeneratingPDF(true);
    setPdfUrl(null);
    
    try {
      const sectionId = filters.section !== "All" ? filters.section : 0;
      const classId = filters.class !== "All" ? filters.class : 0;

      const summaryUrl = `${ALL_REPORTS}/stockReportSummary?hospitalId=${hospitalId}&departmentId=${departmentId}&itemClassId=${classId}&sectionId=${sectionId}&itemId=${currentItemId || 0}&flag=d`;
      const detailsUrl = `${ALL_REPORTS}/stockReportDetail?hospitalId=${hospitalId}&departmentId=${departmentId}&itemClassId=${classId}&sectionId=${sectionId}&itemId=${currentItemId || 0}&flag=d`;

      const url = reportType === "summary" ? summaryUrl : detailsUrl;
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/pdf",
          Authorization: `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await response.blob();
      const fileURL = window.URL.createObjectURL(blob);
      setPdfUrl(fileURL);
      
    } catch (error) {
      console.error("Error generating PDF", error);
      showPopup("Report generation failed", "error")
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Function for print (flag="p") - just fetch the URL, API should handle printing
  const handlePrint = async () => {
    if (stocks.length === 0) {
      alert("Please generate report first");
      return;
    }
    
    setIsPrinting(true);
    
    try {
      const sectionId = filters.section !== "All" ? filters.section : 0;
      const classId = filters.class !== "All" ? filters.class : 0;

      const summaryUrl = `${ALL_REPORTS}/stockReportSummary?hospitalId=${hospitalId}&departmentId=${departmentId}&itemClassId=${classId}&sectionId=${sectionId}&itemId=${currentItemId || 0}&flag=p`;
      const detailsUrl = `${ALL_REPORTS}/stockReportDetail?hospitalId=${hospitalId}&departmentId=${departmentId}&itemClassId=${classId}&sectionId=${sectionId}&itemId=${currentItemId || 0}&flag=p`;

      const url = reportType === "summary" ? summaryUrl : detailsUrl;
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/pdf",
          Authorization: `Bearer ${token}`
        },
      });

      if (response.ok) {
        // API should handle printing automatically when flag="p"
        // No need to open blob or print manually
      } else {
        throw new Error("Failed to send to printer");
      }
      
    } catch (error) {
      console.error("Error printing report", error);
      showPopup("Report generation failed", "error")
    } finally {
      setIsPrinting(false);
    }
  };

  const fatchDrugCodeOptions = async () => {
    try {
      const response = await getRequest(`${MAS_DRUG_MAS}/getAll2/1`);
      if (response && response.response) {
        setDrugCodeOptions(response.response);
      }
    } catch (err) {
      console.error("Error fetching drug options:", err);
    } finally {
    }
  };

  useEffect(() => {
    fatchDrugCodeOptions();
  }, []);

  

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header" >
              <h4 className="card-title mb-0" >
                Stock Status Report
              </h4>
            </div>
            <div className="card-body">
              {/* Filters Section */}
              <div className="row mb-4">
                <div className="col-md-7">
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
                <div className="col-md-5 mb-2">
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
                  <label className="form-label">Drug Code</label>
                  <input
                    ref={(el) => (drugCodeInputRefs.current[0] = el)}
                    type="text"
                    className="form-control"
                    value={filters.itemCode}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFilters((prev) => ({
                        ...prev,
                        itemCode: value,
                        itemName: "", // Clear name
                      }));
                      setActiveCodeDropdown(0);
                    }}
                    placeholder="Enter Drug Code"
                    autoComplete="off"
                    onFocus={() => setActiveCodeDropdown(0)}
                    onBlur={() => {
                      setTimeout(() => {
                        if (!dropdownClickedRef.current) {
                          setActiveCodeDropdown(null);
                        }
                        dropdownClickedRef.current = false;
                      }, 150);
                    }}
                  />
                </div>

                <div className="col-md-8">
                  <label className="form-label">Drug Name</label>
                  <input
                    ref={(el) => (drugNameInputRefs.current[0] = el)}
                    type="text"
                    className="form-control"
                    value={filters.itemName}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFilters((prev) => ({
                        ...prev,
                        itemName: value,
                        itemCode: "", // Clear code
                      }));
                      setActiveNameDropdown(0);
                    }}
                    placeholder="Enter Drug Name"
                    autoComplete="off"
                    onFocus={() => setActiveNameDropdown(0)}
                    onBlur={() => {
                      setTimeout(() => {
                        if (!dropdownClickedRef.current) {
                          setActiveNameDropdown(null);
                        }
                        dropdownClickedRef.current = false;
                      }, 150);
                    }}
                  />
                </div>

                {activeCodeDropdown === 0 && (
                  <ul
                    className="list-group position-fixed"
                    style={{
                      zIndex: 9999,
                      maxHeight: 180,
                      overflowY: "auto",
                      width: "250px",
                      top: `${drugCodeInputRefs.current[0]?.getBoundingClientRect().bottom + window.scrollY}px`,
                      left: `${drugCodeInputRefs.current[0]?.getBoundingClientRect().left + window.scrollX}px`,
                      backgroundColor: "white",
                      border: "1px solid #dee2e6",
                      borderRadius: "0.375rem",
                      boxShadow: "0 0.5rem 1rem rgba(0, 0, 0, 0.15)",
                    }}
                  >
                    {drugCodeOptions
                      .filter((opt) =>
                        opt.code.toLowerCase().includes(filters.itemCode.toLowerCase())
                      )
                      .map((opt) => (
                        <li
                          key={opt.id}
                          className="list-group-item list-group-item-action"
                          style={{ cursor: "pointer" }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            dropdownClickedRef.current = true;
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            setFilters((prev) => ({
                              ...prev,
                              itemCode: opt.code,
                              itemName: opt.name,
                            }));
                            setCurrentItemId(opt.id);
                            setActiveCodeDropdown(null);
                            dropdownClickedRef.current = false;
                          }}
                        >
                          {opt.code} - {opt.name}
                        </li>
                      ))}
                  </ul>
                )}

                {activeNameDropdown === 0 && (
                  <ul
                    className="list-group position-fixed"
                    style={{
                      zIndex: 9999,
                      maxHeight: 180,
                      overflowY: "auto",
                      width: "400px",
                      top: `${drugNameInputRefs.current[0]?.getBoundingClientRect().bottom + window.scrollY}px`,
                      left: `${drugNameInputRefs.current[0]?.getBoundingClientRect().left + window.scrollX}px`,
                      backgroundColor: "white",
                      border: "1px solid #dee2e6",
                      borderRadius: "0.375rem",
                      boxShadow: "0 0.5rem 1rem rgba(0, 0, 0, 0.15)",
                    }}
                  >
                    {drugCodeOptions
                      .filter((opt) =>
                        opt.name.toLowerCase().includes(filters.itemName.toLowerCase())
                      )
                      .map((opt) => (
                        <li
                          key={opt.id}
                          className="list-group-item list-group-item-action"
                          style={{ cursor: "pointer" }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            dropdownClickedRef.current = true;
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            setFilters((prev) => ({
                              ...prev,
                              itemCode: opt.code,
                              itemName: opt.name,
                            }));
                            setCurrentItemId(opt.id);
                            setActiveNameDropdown(null);
                            dropdownClickedRef.current = false;
                          }}
                        >
                          {opt.name} ({opt.code})
                        </li>
                      ))}
                  </ul>
                )}
              </div>

              {/* Report Type Selection */}
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
                        setReportGenerated(false); // Reset report on type change
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
                        setReportGenerated(false); // Reset report on type change
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
                  >
                    Search
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary me-2"
                    onClick={handleViewDownload}
                    disabled={isGeneratingPDF || stocks.length === 0}
                  >
                    {isGeneratingPDF ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Generating...
                      </>
                    ) : (
                      <>
                        <i className="fa fa-eye me-2"></i> VIEW/DOWNLOAD
                      </>
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
                      <>
                        <i className="fa fa-print me-2"></i> PRINT
                      </>
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
                              <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
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
                              <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                              <td>{item.itemCode}</td>
                              <td>{item.itemName}</td>
                              <td>{item.unitAu}</td>
                              <td>{item.batchNo}</td>
                              <td>{item.dom}</td>
                              <td>{item.doe}</td>
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
              <>
              <Pagination
                             totalItems={filteredStockList.length}
                             itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                             currentPage={currentPage}
                             onPageChange={setCurrentPage}
                           /> 
                 </>          
            </div>
          </div>
        </div>
      </div>

      {/* PDF Viewer Modal */}
      {pdfUrl && (
        <PdfViewer
          pdfUrl={pdfUrl}
          onClose={() => {
            setPdfUrl(null);
          }}
          name={`Stock Status Report - ${reportType === 'summary' ? 'Summary' : 'Detail'}`}
        />
      )}

      {/* Popup Message */}
      {popupMessage && <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />}
    </div>
  )
}

export default StockStatusReport