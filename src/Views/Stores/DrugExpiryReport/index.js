import { useState, useRef, useEffect } from "react"
import Popup from "../../../Components/popup"
import LoadingScreen from "../../../Components/Loading/index";
import { getRequest } from "../../../service/apiService";
import { OPEN_BALANCE, MAS_DRUG_MAS } from "../../../config/apiConfig";


const DrugExpiry = () => {
  const [searchFormData, setSearchFormData] = useState({
    drugCode: "",
    drugName: "",
    fromDate: "",
    toDate: "",
  });

  const [drugCodeQuery, setDrugCodeQuery] = useState("");
  const [drugNameQuery, setDrugNameQuery] = useState("");
  const [filteredDrugList, setFilteredDrugList] = useState([]);
  const [showCodeDropdown, setShowCodeDropdown] = useState(false);
  const [showNameDropdown, setShowNameDropdown] = useState(false);


  console.log("searchFormData", searchFormData)

  const [filteredResults, setFilteredResults] = useState([])
  const [filtered, setFiltered] = useState([])

  const [showResults, setShowResults] = useState(false)
  const [popupMessage, setPopupMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")
  const [showDrugDropdown, setShowDrugDropdown] = useState(false)
  const drugDropdownRef = useRef(null)
  const [drugCodeOptions, setDrugCodeOptions] = useState([]);
  const [loading, setLoading] = useState(false)

  console.log("filteredResults", filteredResults)


  const fatchDrugCodeOptions = async () => {
    try {
      setLoading(true);
      const response = await getRequest(`${MAS_DRUG_MAS}/getAll2/1`);
      if (response && response.response) {
        setDrugCodeOptions(response.response);
      }
    } catch (err) {
      console.error("Error fetching drug options:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fatchDrugCodeOptions();
  }, []);



  useEffect(() => {
    if (!showDrugDropdown) return;
    function handleClickOutside(event) {
      if (drugDropdownRef.current && !drugDropdownRef.current.contains(event.target)) {
        setShowDrugDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDrugDropdown]);

  const itemsPerPage = 5


  const handleSearchInputChange = (e) => {
    const { id, value } = e.target
    setSearchFormData((prevData) => ({ ...prevData, [id]: value }))
  }

  const handleDrugCodeSearch = (e) => {
    const query = e.target.value;
    setDrugCodeQuery(query);
    setShowCodeDropdown(true);

    const filtered = drugCodeOptions.filter((drug) =>
      drug.code.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredDrugList(filtered);
  };

  const handleDrugNameSearch = (e) => {
    const query = e.target.value;
    setDrugNameQuery(query);
    setShowNameDropdown(true);

    const filtered = drugCodeOptions.filter((drug) =>
      drug.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredDrugList(filtered);
  };

  const handleDrugSelection = (drug) => {
    setSearchFormData({
      ...searchFormData,
      drugCode: drug.id,
      drugName: drug.id,
    });
    setDrugCodeQuery(drug.code);
    setDrugNameQuery(drug.name);
    setShowCodeDropdown(false);
    setShowNameDropdown(false);
  };



  const handleSearchSubmit = async (event) => {
    event.preventDefault();

    if (!searchFormData.fromDate || !searchFormData.toDate) {
      showPopup("Please fill all mandatory fields (Drug Code, From Date, To Date)", "error")
      return
    }

    if (searchFormData.fromDate && searchFormData.toDate) {
      await fetchBatchStock();
    } else {
      console.warn("Please select both fromDate and toDate");
    }
  };


const fetchBatchStock = async () => {
  try {
    const { fromDate, toDate, drugCode } = searchFormData;

    const drugCodeStr = (drugCode ?? "").toString().trim();

    const itemId = drugCodeStr || "0";

    let url = `${OPEN_BALANCE}/stocks/${fromDate}/${toDate}/${itemId}`;
    
    if (drugCodeStr) {
      url += `?itemId=${encodeURIComponent(drugCodeStr)}`;
    }

    const data = await getRequest(url);
    if (data.status === 200 && Array.isArray(data.response)) {
      setFiltered(data.response);
      setFilteredResults(data.response);
      setShowResults(true);
      setCurrentPage(1);
    } else {
      setFiltered([]);
      setFilteredResults([]);
      setShowResults(true);
    }
  } catch (error) {
   setFiltered([]);
    setFilteredResults([]);
    setShowResults(true); // <-- ensure this is set
    console.error("Error fetching Store Item data:", error);
  }
};


  const handleReset = () => {
    setSearchFormData({
      drugCode: "",
      drugName: "",
      fromDate: "",
      toDate: ""
    });

    setDrugCodeQuery("");
    setDrugNameQuery("");
    setFilteredResults([]);
    setShowCodeDropdown(false);
    setShowNameDropdown(false);
    setShowResults(false);
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

  const handlePrint = () => {
    window.print()
  }

  const filteredTotalPages = Math.ceil(filteredResults.length / itemsPerPage)
  const currentItems = filteredResults.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

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
              <h4 className="card-title p-2 mb-0">Drug Expiry</h4>
            </div>
            <div className="card-body">
              <form className="forms row" >
                <div className="row">
                  <div className="form-group col-md-4 mt-3">
                    <label>
                      From Date <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      id="fromDate"
                      onChange={handleSearchInputChange}
                      value={searchFormData.fromDate}
                      max={searchFormData.toDate || new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>
                  <div className="form-group col-md-4 mt-3">
                    <label>
                      To Date <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      id="toDate"
                      onChange={handleSearchInputChange}
                      value={searchFormData.toDate}
                      min={searchFormData.fromDate}
                      required
                    />
                  </div>
                  <div className="form-group col-md-4 mt-3 position-relative">
                    <label>
                      Drug Code <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="drugCode"
                      placeholder="Search Drug Code"
                      onChange={handleDrugCodeSearch}
                      value={drugCodeQuery}
                      onFocus={() => setShowCodeDropdown(true)}
                    />
                    {showCodeDropdown && drugCodeQuery && filteredDrugList.length > 0 && (
                      <ul
                        className="list-group position-absolute w-100 mt-1"
                        style={{ zIndex: 1050, maxHeight: "250px", overflowY: "auto" }}
                      >
                        {filteredDrugList.map((drug) => (
                          <li
                            key={drug.code}
                            className="list-group-item list-group-item-action"
                            onClick={() => handleDrugSelection(drug)}
                            style={{ cursor: "pointer" }}
                          >
                            <strong>{drug.code}</strong> - {drug.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="form-group col-md-4 mt-3 position-relative">
                    <label>Drug Name</label>
                    <input
                      type="text"
                      className="form-control"
                      id="drugName"
                      placeholder="Search Drug Name"
                      onChange={handleDrugNameSearch}
                      value={drugNameQuery}
                      onFocus={() => setShowNameDropdown(true)}
                    />
                    {showNameDropdown && drugNameQuery && filteredDrugList.length > 0 && (
                      <ul
                        className="list-group position-absolute w-100 mt-1"
                        style={{ zIndex: 1050, maxHeight: "250px", overflowY: "auto" }}
                      >
                        {filteredDrugList.map((drug) => (
                          <li
                            key={drug.code}
                            className="list-group-item list-group-item-action"
                            onClick={() => handleDrugSelection(drug)}
                            style={{ cursor: "pointer" }}
                          >
                            <strong>{drug.code}</strong> - {drug.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="form-group col-md-4 mt-3 d-flex align-items-end">
                    <button
                      type="submit"
                      className="btn btn-primary me-2"
                      onClick={handleSearchSubmit}
                    >
                      Search
                    </button>

                    <button
                      type="button" // <-- Change to button
                      className="btn btn-primary me-2"
                      onClick={handleReset} // <-- Use onClick
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </form>

              {showResults && (
                <>
                  {filteredResults.length > 0 ? (
                    <div className="mt-4">
                      <div className="table-responsive">
                        <table className="table table-bordered table-hover align-middle">
                          <thead >
                            <tr>
                              <th>Drug Code</th>
                              <th>Drug Name</th>
                              <th>A/U</th>
                              <th>Batch No.</th>
                              <th>Closing Stock</th>
                              <th>Expiry Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentItems.map((item) => (
                              <tr key={item.stockId}>
                                <td>{item.itemCode}</td>
                                <td>{item.itemName}</td>
                                <td>{item.unitAu}</td>
                                <td>{item.batchNo}</td>
                                <td>{item.closingQty}</td>
                                <td>{new Date(item.doe).toLocaleDateString('en-GB')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {filteredTotalPages > 1 && (
                        <nav className="d-flex justify-content-between align-items-center mt-3">
                          <div>
                            <span>
                              Page {currentPage} of {filteredTotalPages} | Total Records: {filteredResults.length}
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
                              overflow="auto"
                            />
                            <button className="btn btn-primary" onClick={handlePageNavigation}>
                              Go
                            </button>
                          </div>
                        </nav>
                      )}
                    </div>
                  ) : (
                    <div className="mt-4 text-center text-danger">
                      No records found.
                    </div>
                  )}

                  <div className="d-flex justify-content-end mt-3">
                    <button
                      type="button"
                      className="btn btn-primary "
                      onClick={handlePrint}

                    >
                      Print
                    </button>
                  </div>
                </>
              )}

              {popupMessage && (
                <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DrugExpiry
