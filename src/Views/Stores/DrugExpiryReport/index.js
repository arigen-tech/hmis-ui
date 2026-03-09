import { useState, useEffect } from "react"
import Popup from "../../../Components/popup"
import LoadingScreen from "../../../Components/Loading/index";
import { getRequest } from "../../../service/apiService";
import { OPEN_BALANCE, MAS_DRUG_MAS, ALL_REPORTS } from "../../../config/apiConfig";
import PdfViewer from "../../../Components/PdfViewModel/PdfViewer"
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import {
  SELECT_DATES_ERR_MSG,
  FROM_DATE_LATER_THAN_TO_DATE_ERR_MSG,
  REPORT_GEN_FAILED_ERR_MSG,
  PRINT_FAILED_ERR_MSG
} from "../../../config/constants";

const DrugExpiry = () => {
  const today = new Date().toISOString().split("T")[0];
  const [searchFormData, setSearchFormData] = useState({
    drugCode: "",
    drugName: "",
    fromDate: today,
    toDate: today,
    daysOption: "",
  });

  const [drugCodeQuery, setDrugCodeQuery] = useState("");
  const [drugNameQuery, setDrugNameQuery] = useState("");
  const [filteredDrugList, setFilteredDrugList] = useState([]);
  const [showCodeDropdown, setShowCodeDropdown] = useState(false);
  const [showNameDropdown, setShowNameDropdown] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isPrintingPDF, setPrintingPDF] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [dateFieldsEnabled, setDateFieldsEnabled] = useState(true);

  const [filteredResults, setFilteredResults] = useState([])

  const [showResults, setShowResults] = useState(false)
  const [popupMessage, setPopupMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false);

  const hospitalId = sessionStorage.getItem("hospitalId") || localStorage.getItem("hospitalId");
  const departmentId = sessionStorage.getItem("departmentId") || localStorage.getItem("departmentId");

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

  const [drugCodeOptions, setDrugCodeOptions] = useState([]);

  useEffect(() => {
    fatchDrugCodeOptions();
  }, []);

  const handleSearchInputChange = (e) => {
    const { id, value } = e.target

    if (id === "daysOption") {
      const newValue = value;
      setSearchFormData(prevData => ({
        ...prevData,
        [id]: newValue
      }));

      // Enable/disable date fields based on selection
      if (newValue === "other") {
        setDateFieldsEnabled(true);
      } else if (newValue) {
        setDateFieldsEnabled(false);

        // Calculate dates based on selected days
        const today = new Date();
        let toDate = new Date();

        if (newValue === "30") {
          toDate.setDate(today.getDate() + 30);
        } else if (newValue === "60") {
          toDate.setDate(today.getDate() + 60);
        } else if (newValue === "90") {
          toDate.setDate(today.getDate() + 90);
        } else if (newValue === "120") {
          toDate.setDate(today.getDate() + 120);
        } else {
          toDate = today;
        }

        const formatDate = (date) => {
          return date.toISOString().split("T")[0];
        };

        setSearchFormData(prevData => ({
          ...prevData,
          daysOption: newValue,
          fromDate: formatDate(today),
          toDate: formatDate(toDate)
        }));
      }
    } else {
      setSearchFormData((prevData) => ({ ...prevData, [id]: value }))
    }
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
      showPopup(SELECT_DATES_ERR_MSG, "error")
      return
    }

    if (searchFormData.fromDate && searchFormData.toDate) {
      await fetchBatchStock();
    }
  };

  const fetchBatchStock = async () => {
    try {
      setIsSearching(true);
      const { fromDate, toDate, drugCode } = searchFormData;

      const drugCodeStr = (drugCode ?? "").toString().trim();

      const itemId = drugCodeStr || "0";

      let url = `${OPEN_BALANCE}/stocks/${fromDate}/${toDate}/${itemId}/${hospitalId}/${departmentId}`;

      if (drugCodeStr) {
        url += `?itemId=${encodeURIComponent(drugCodeStr)}`;
      }

      const data = await getRequest(url);
      if (data.status === 200 && Array.isArray(data.response)) {
        setFilteredResults(data.response);
        setShowResults(true);
        setCurrentPage(1);
      } else {
        setFilteredResults([]);
        setShowResults(true);
      }
    } catch (error) {
      setFilteredResults([]);
      setShowResults(true);
      console.error("Error fetching Store Item data:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleReset = () => {
    setSearchFormData({
      drugCode: "",
      drugName: "",
      fromDate: today,
      toDate: today,
      daysOption: "",
    });

    setDrugCodeQuery("");
    setDrugNameQuery("");
    setFilteredResults([]);
    setShowCodeDropdown(false);
    setShowNameDropdown(false);
    setShowResults(false);
    setDateFieldsEnabled(true);
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

  const handleGenerate = async () => {
    const fromDate = searchFormData.fromDate;
    const toDate = searchFormData.toDate;

    if (!fromDate || !toDate) {
      showPopup(SELECT_DATES_ERR_MSG, "error");
      return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
      showPopup(FROM_DATE_LATER_THAN_TO_DATE_ERR_MSG, "error");
      return;
    }

    setIsGeneratingPDF(true);

    try {
      // Start with base URL
      let url = `${ALL_REPORTS}/drugExpiryReport?hospitalId=${hospitalId}&departmentId=${departmentId}&fromDate=${fromDate}&toDate=${toDate}&flag=d`;

      // Only add itemId if a drug was actually selected
      if (searchFormData.drugCode) {
        url += `&itemId=${searchFormData.drugCode}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/pdf",
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
      showPopup(REPORT_GEN_FAILED_ERR_MSG, "error");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrintReport = async () => {
    setPrintingPDF(true);

    try {
      const fromDate = searchFormData.fromDate;
      const toDate = searchFormData.toDate;

      // Start with base URL
      let url = `${ALL_REPORTS}/drugExpiryReport?hospitalId=${hospitalId}&departmentId=${departmentId}&fromDate=${fromDate}&toDate=${toDate}&flag=p`;

      // Only add itemId if a drug was actually selected
      if (searchFormData.drugCode) {
        url += `&itemId=${searchFormData.drugCode}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/pdf",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to print");
      }

    } catch (error) {
      console.error("Error printing report", error);
      showPopup(PRINT_FAILED_ERR_MSG, "error");
    } finally {
      setPrintingPDF(false);
    }
  };

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredResults.slice(indexOfFirst, indexOfLast);

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header" >
              <h4 className="card-title p-2 mb-0">Drug Expiry Report</h4>
            </div>
            {pdfUrl && (
              <PdfViewer
                pdfUrl={pdfUrl}
                onClose={() => setPdfUrl(null)}
                name={"Drug Expiry Report"}
              />
            )}
            {loading && <LoadingScreen />}

            <div className="card-body">
              <form className="forms row" onSubmit={handleSearchSubmit}>
                <div className="row">
                  <div className="form-group col-md-4 mt-3">
                    <label>
                      Select Days <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      id="daysOption"
                      onChange={handleSearchInputChange}
                      value={searchFormData.daysOption}
                      required
                    >
                      <option value="">Select Days</option>
                      <option value="30">30 Days</option>
                      <option value="60">60 Days</option>
                      <option value="90">90 Days</option>
                      <option value="120">120 Days</option>
                      <option value="other">Other Dates</option>
                    </select>
                  </div>

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
                      disabled={!dateFieldsEnabled}
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
                      disabled={!dateFieldsEnabled}
                    />
                  </div>
                  <div className="form-group col-md-4 mt-3 position-relative">
                    <label>
                      Drug Code
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
                      disabled={isSearching}
                    >
                      {isSearching ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Searching...
                        </>
                      ) : (
                        "Search"
                      )}
                    </button>

                    <button
                      type="button"
                      className="btn btn-primary me-2"
                      onClick={handleReset}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </form>

              {showResults && (
                <>
                  <div className="mt-4">
                    <div className="table-responsive">
                      <table className="table table-bordered table-hover align-middle">
                        <thead>
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
                          {filteredResults.length > 0 ? (
                            currentItems.map((item) => (
                              <tr key={item.stockId}>
                                <td>{item.itemCode}</td>
                                <td>{item.itemName}</td>
                                <td>{item.unitAu}</td>
                                <td>{item.batchNo}</td>
                                <td>{item.closingQty}</td>
                                <td>{new Date(item.doe).toLocaleDateString('en-GB')}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="6" className="text-center text-danger">
                                No records found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {filteredResults.length > 0 && (
                    <>
                      {/* PAGINATION USING REUSABLE COMPONENT */}
                      <Pagination
                        totalItems={filteredResults.length}
                        itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                      />
                      
                      <div className="d-flex justify-content-end mt-3 gap-2">
                        <button
                          type="button"
                          className="btn btn-success btn-sm"
                          onClick={handleGenerate}
                          disabled={isGeneratingPDF || filteredResults.length === 0}
                        >
                          {isGeneratingPDF ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Generating...
                            </>
                          ) : (
                            <>
                              <i className="fa fa-eye me-2"></i>
                              VIEW / DOWNLOAD
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          className="btn btn-warning btn-sm"
                          onClick={handlePrintReport}
                          disabled={isPrintingPDF || filteredResults.length === 0}
                        >
                          {isPrintingPDF ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Printing...
                            </>
                          ) : (
                            <>
                              <i className="fa fa-print me-2"></i>
                              PRINT
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}
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