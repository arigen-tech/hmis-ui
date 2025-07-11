import { useState, useEffect } from "react"
import Popup from "../../../Components/popup"
import './StockStatusReport.css';
import { getRequest, putRequest, postRequest } from "../../../service/apiService";
import { MAS_ITEM_SECTION, MAS_ITEM_CLASS, OPEN_BALANCE } from "../../../config/apiConfig";
import LoadingScreen from "../../../Components/Loading";


const StockStatusReport = () => {
  const [sections, setSections] = useState([])
  const [classes, setClasses] = useState([])
  const [stocks, setStocks] = useState([])
  const [loading, setLoading] = useState(true)


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
  const [isPrinting, setIsPrinting] = useState(false);

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

  const filteredTotalPages = Math.ceil(filteredStockList.length / itemsPerPage)
  const currentItems = filteredStockList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

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
      const data = await getRequest(`${OPEN_BALANCE}/getAllStock/${reportType}`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setStocks(data.response);
        showPopup("Report generated successfully!", "success");
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


  const handlePrintReport = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  }

  const handlePageNavigation = () => {
    const pageNumber = Number.parseInt(pageInput, 10)
    if (pageNumber > 0 && pageNumber <= filteredTotalPages) {
      setCurrentPage(pageNumber)
    } else {
      alert("Please enter a valid page number.")
    }
  }

  const renderPagination = () => {
    const pageNumbers = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(filteredTotalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    if (startPage > 1) {
      pageNumbers.push(1)
      if (startPage > 2) pageNumbers.push("...")
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i)
    }

    if (endPage < filteredTotalPages) {
      if (endPage < filteredTotalPages - 1) pageNumbers.push("...")
      pageNumbers.push(filteredTotalPages)
    }

    return pageNumbers.map((number, index) => (
      <li key={index} className={`page-item ${number === currentPage ? "active" : ""}`}>
        {typeof number === "number" ? (
          <button className="page-link" onClick={() => setCurrentPage(number)}>
            {number}
          </button>
        ) : (
          <span className="page-link disabled">{number}</span>
        )}
      </li>
    ))
  }

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
            {/* {loading && <LoadingScreen />} */}
            <div className="card-body">
              {/* Filters Section */}
              <div className="row mb-4">

                <div className="col-md-2">
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
                <div className="col-md-2">
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
                <div className="col-md-3">
                  <label className="form-label">Drug Code</label>
                  <input
                    type="text"
                    className="form-control"
                    id="itemCode"
                    placeholder="Enter Drug Code"
                    value={filters.itemCode}
                    onChange={handleFilterChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Drug Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="itemName"
                    placeholder="Enter Drug Name"
                    value={filters.itemName}
                    onChange={handleFilterChange}
                  />
                </div>
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
                    className="btn btn-success me-2"

                    onClick={handleGenerateReport}
                  >
                    Generate Report
                  </button>
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={handlePrintReport}
                  >
                    Print Report
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
                        {(isPrinting ? filteredStockList : currentItems).map((item, index) => (
                          <tr key={item.stockId}>
                            <td>{(isPrinting ? index + 1 : (currentPage - 1) * itemsPerPage + index + 1)}</td>
                            <td>{item.itemCode}</td>
                            <td>{item.itemName}</td>
                            <td>{item.unitAu}</td>
                            <td>{item.openingQty}</td>
                          </tr>
                        ))}
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
                        {(isPrinting ? filteredStockList : currentItems).map((item, index) => (
                          <tr key={item.stockId}>
                            <td>{(isPrinting ? index + 1 : (currentPage - 1) * itemsPerPage + index + 1)}</td>
                            <td>{item.itemCode}</td>
                            <td>{item.itemName}</td>
                            <td>{item.unitAu}</td>
                            <td>{item.batchNo}</td>
                            <td>{item.dom}</td>
                            <td>{item.doe}</td>
                            <td>{item.openingQty}</td>
                            <td>{item.medicineSource}</td>
                            <td>{item.manufacturerName}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Pagination */}
              <nav className="d-flex justify-content-between align-items-center mt-3">
                <div>
                  <span>
                    Page {currentPage} of {filteredTotalPages} | Total Records: {filteredStockList.length}
                  </span>
                </div>
                <ul className="pagination mb-0">
                  <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      &laquo; Previous
                    </button>
                  </li>
                  {renderPagination()}
                  <li className={`page-item ${currentPage === filteredTotalPages ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === filteredTotalPages}
                    >
                      Next &raquo;
                    </button>
                  </li>
                </ul>
                <div className="d-flex align-items-center">
                  <input
                    type="number"
                    min="1"
                    max={filteredTotalPages}
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    placeholder="Go to page"
                    className="form-control me-2"
                    style={{ width: "120px" }}
                  />
                  <button className="btn btn-primary" onClick={handlePageNavigation}>
                    Go
                  </button>
                </div>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Popup Message */}
      {popupMessage && <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />}
    </div>
  )
}

export default StockStatusReport
