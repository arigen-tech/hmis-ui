import { useState, useEffect, useRef } from "react";
import LoadingScreen from "../../../Components/Loading";
import { getRequest } from "../../../service/apiService";
import {
  INVOICE_REPORTS,
  LAB_INVOICE_API,
  OPD_INVOICE_API,
  PRESCRIPTION_INVOICE_REPORT,
  RADIOLOGY_INVOICE_API,
} from "../../../config/apiConfig";
import Popup from "../../../Components/popup";
import PdfViewer from "../../../Components/PdfViewModel/PdfViewer";
import Pagination, {
  DEFAULT_ITEMS_PER_PAGE,
} from "../../../Components/Pagination";

const SERVICE_CATEGORY_API = "/master/masServiceCategory/getAll/1";

const PatientwiseBilldatails = () => {
  const [patientList, setPatientList] = useState([]);
  const [searchData, setSearchData] = useState({
    patientName: "",
    mobileNo: "",
    registrationNo: "",
    serviceCategoryId: "",
  });
  const [serviceCategories, setServiceCategories] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageInput, setPageInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const itemsPerPage = DEFAULT_ITEMS_PER_PAGE;

  // PDF handling states
  const [pdfUrl, setPdfUrl] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [generatingPdfIds, setGeneratingPdfIds] = useState(new Set());
  const [printingIds, setPrintingIds] = useState(new Set());

  // Custom dropdown state
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
  const serviceDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        serviceDropdownRef.current &&
        !serviceDropdownRef.current.contains(event.target)
      ) {
        setIsServiceDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showPopup = (message, type = "info", onCloseCallback = null) => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
        if (onCloseCallback) onCloseCallback();
      },
    });
  };

  // Fetch service categories on mount
  useEffect(() => {
    const fetchServiceCategories = async () => {
      try {
        const response = await getRequest(SERVICE_CATEGORY_API);
        if (response && response.response) {
          setServiceCategories(response.response);
        }
      } catch (error) {
        console.error("Failed to fetch service categories", error);
      }
    };
    fetchServiceCategories();
  }, []);

  useEffect(() => {
    setCurrentPage(0);
  }, [
    searchData.patientName,
    searchData.mobileNo,
    searchData.registrationNo,
    searchData.serviceCategoryId,
  ]);

  useEffect(() => {
    if (hasSearched) {
      handleSearch(currentPage);
    }
  }, [currentPage]);

  const isGeneratingPdf = (recordId) => generatingPdfIds.has(recordId);
  const isPrinting = (recordId) => printingIds.has(recordId);

  const generateReport = async (record, flag = "D") => {
    const recordId = record.id;

    if (flag === "D") {
      setGeneratingPdfIds((prev) => new Set(prev).add(recordId));
    } else {
      setPrintingIds((prev) => new Set(prev).add(recordId));
    }

    setPdfUrl(null);
    setSelectedRecord(record);
    try {
      let apiUrl = "";

      if (record.serviceCategoryId === 1) {
        apiUrl = `${OPD_INVOICE_API}?visit=${record.visitId}&flag=${flag}`;
      } else if (record.serviceCategoryId === 2) {
        apiUrl = `${LAB_INVOICE_API}?billNo=${record.billNo}&flag=${flag}`;
      } else if (record.serviceCategoryId === 4) {
        apiUrl = `${RADIOLOGY_INVOICE_API}?billNo=${record.billNo}&flag=${flag}`;
      } else if (record.serviceCategoryId === 3) {
        apiUrl = `${PRESCRIPTION_INVOICE_REPORT}?prescriptionId=${record.prescriptionHeaderId}&flag=${flag}`;
      } else {
        showPopup(
          "Report type not supported for this service category",
          "error"
        );
        return;
      }

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Accept: "application/pdf",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      if (flag === "D") {
        const blob = await response.blob();
        const fileURL = window.URL.createObjectURL(blob);
        setPdfUrl(fileURL);
      } else {
        showPopup("Report sent to printer successfully!", "success");
      }
    } catch (error) {
      console.error("Error generating PDF", error);
      if (flag === "D") {
        showPopup("Failed to generate report", "error");
      } else {
        showPopup("Failed to print report", "error");
      }
    } finally {
      if (flag === "D") {
        setGeneratingPdfIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(recordId);
          return newSet;
        });
      } else {
        setPrintingIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(recordId);
          return newSet;
        });
      }
    }
  };

  const handleSearch = async (page = currentPage) => {
    if (
      !searchData.patientName &&
      !searchData.mobileNo &&
      !searchData.registrationNo &&
      !searchData.serviceCategoryId
    ) {
      showPopup("Please enter at least one search field", "info");
      return;
    }
    setHasSearched(true);

    try {
      setSearchLoading(true);

      const params = {};

      if (searchData.patientName) params.patientName = searchData.patientName;
      if (searchData.mobileNo) params.phoneNo = searchData.mobileNo;
      if (searchData.registrationNo)
        params.registrationNo = searchData.registrationNo;
      if (searchData.serviceCategoryId)
        params.serviceCategoryId = searchData.serviceCategoryId;

      const queryParams = new URLSearchParams(params);

      const response = await getRequest(
        `${INVOICE_REPORTS}?${queryParams.toString()}&page=${page}&size=${itemsPerPage}`
      );

      if (response && response.response) {
        const pageData = response.response;

        const mappedData = pageData.content.map((item) => ({
          id: item.headerId,
          visitId: item.visitId,
          prescriptionHeaderId: item.prescriptionHeaderId,
          patientName: item.patientName || "",
          mobileNo: item.phoneNo || "",
          age: item.age || "",
          sex: item.sex || "",
          relation: item.relation || "",
          billingType: item.serviceCategoryName || "",
          department: item.department || "",
          amount: item.netAmount,
          billingStatus: item.paymentStatus,
          billNo: item.billNo,
          billDate: item.billDate || "",
          serviceCategoryId: item.serviceCategoryId || null,
          registrationNo: item.registrationNo || null,
        }));

        setPatientList(mappedData);
        setTotalElements(pageData.totalElements);
        setTotalPages(pageData.totalPages);
      }
    } catch (error) {
      console.error("Search error:", error);
      showPopup("Search failed", "error");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleViewReport = (record) => {
    console.log("View report for:", record);
    generateReport(record, "D");
  };

  const handlePrintReport = (record) => {
    console.log("Print report for:", record);
    generateReport(record, "P");
  };

  const handleSearchChange = (e) => {
    const { id, value } = e.target;
    setSearchData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // Custom dropdown selection handler
  const handleServiceSelect = (serviceCategoryId) => {
    setSearchData((prev) => ({
      ...prev,
      serviceCategoryId: serviceCategoryId,
    }));
    setIsServiceDropdownOpen(false);
  };

  const handleSearchReset = () => {
    setSearchData({
      patientName: "",
      mobileNo: "",
      registrationNo: "",
      serviceCategoryId: "",
    });
    setPatientList([]);
    setHasSearched(false);
    setCurrentPage(0);
    setTotalElements(0);
    setTotalPages(0);
  };

  const currentItems = patientList;

  const handlePageChange = (page) => {
    setCurrentPage(page - 1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB");
    } catch (error) {
      return dateString;
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "bg-success";
      case "pending":
        return "bg-warning";
      case "cancelled":
        return "bg-danger";
      default:
        return "bg-secondary";
    }
  };

  const getBillingTypeBadge = (type) => {
    switch (type?.toLowerCase()) {
      case "op":
        return "bg-info";
      case "ip":
        return "bg-primary";
      default:
        return "bg-secondary";
    }
  };

  // Helper to get selected service display text
  const getSelectedServiceText = () => {
    if (!searchData.serviceCategoryId) return "All";
    const selected = serviceCategories.find(
      (cat) => String(cat.id) === String(searchData.serviceCategoryId)
    );
    return selected ? selected.serviceCatName : "All";
  };

  // Helper to get service category code for PDF file name
  const getServiceCategoryCode = (serviceCategoryId) => {
    if (!serviceCategoryId) return "";
    const category = serviceCategories.find(
      (cat) => String(cat.id) === String(serviceCategoryId)
    );
    return category ? category.serviceCateCode : "";
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="content-wrapper">
      {/* Popup Component */}
      {popupMessage && (
        <Popup
          message={popupMessage.message}
          type={popupMessage.type}
          onClose={popupMessage.onClose}
        />
      )}

      {/* PDF Viewer Component */}
      {pdfUrl && selectedRecord && (
        <PdfViewer
          pdfUrl={pdfUrl}
          onClose={() => {
            setPdfUrl(null);
            setSelectedRecord(null);
          }}
          name={`${getServiceCategoryCode(selectedRecord?.serviceCategoryId)} Invoice - ${selectedRecord?.patientName || "Patient"}`}
        />
      )}

      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title p-2">
                Invoice Report – OPD, Lab, and Radiology
              </h4>
            </div>

            <div className="card-body">
              <div className="card-body">
                <form>
                  <div className="row g-4 align-items-end">
                    <div className="col-md-4">
                      <label className="form-label">Patient Name</label>
                      <input
                        type="text"
                        className="form-control"
                        id="patientName"
                        placeholder="Enter patient name"
                        value={searchData.patientName}
                        onChange={handleSearchChange}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Mobile No.</label>
                      <input
                        type="text"
                        className="form-control"
                        id="mobileNo"
                        placeholder="Enter Mobile number"
                        value={searchData.mobileNo}
                        onChange={handleSearchChange}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Registration No</label>
                      <input
                        type="text"
                        className="form-control"
                        id="registrationNo"
                        placeholder="Enter registration number"
                        value={searchData.registrationNo}
                        onChange={handleSearchChange}
                      />
                    </div>
                    {/* Custom Service Dropdown */}
                    <div className="col-md-4" ref={serviceDropdownRef}>
                      <label className="form-label">Service</label>
                      <div className="dropdown">
                        <button
                          className="form-select text-start dropdown-toggle"
                          type="button"
                          onClick={() =>
                            setIsServiceDropdownOpen(!isServiceDropdownOpen)
                          }
                        >
                          {getSelectedServiceText()}
                        </button>
                        {isServiceDropdownOpen && (
                          <ul
                            className="dropdown-menu show w-100"
                            style={{ maxHeight: "300px", overflowY: "auto" }}
                          >
                            <li>
                              <button
                                className="dropdown-item"
                                type="button"
                                onClick={() => handleServiceSelect("")}
                              >
                                All
                              </button>
                            </li>
                            {serviceCategories.map((cat) => (
                              <li key={cat.id}>
                                <button
                                  className="dropdown-item"
                                  type="button"
                                  onClick={() =>
                                    handleServiceSelect(String(cat.id))
                                  }
                                >
                                  <span className="d-block fw-bold">
                                    {cat.serviceCatName}
                                  </span>
                                  <span className="d-block text-muted small">
                                    {cat.serviceCateCode.replace(/_/g, " ")}
                                  </span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                    <div className="col-md-4 d-flex">
                      <button
                        type="button"
                        className="btn btn-primary me-2"
                        onClick={() => {
                          setCurrentPage(0);
                          handleSearch(0);
                        }}
                        disabled={searchLoading}
                      >
                        {searchLoading ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            Searching...
                          </>
                        ) : (
                          <>Search</>
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleSearchReset}
                        disabled={searchLoading}
                      >
                        <i className="mdi mdi-refresh"></i> Reset
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {!error && hasSearched && currentItems.length === 0 && (
                <div className="alert alert-info" role="alert">
                  <i className="mdi mdi-information"></i> No billing records
                  found.
                </div>
              )}

              {currentItems.length > 0 && (
                <div className="table-responsive packagelist">
                  <table className="table table-bordered table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Registration No</th>
                        <th>Bill No</th>
                        <th>Patient Name</th>
                        <th>Mobile No.</th>
                        <th>Age/Gender</th>
                        <th>Relation</th>
                        <th>Department</th>
                        <th>Bill Date</th>
                        <th>Amount</th>
                        <th>Billing Type</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((item) => (
                        <tr key={item.id}>
                          <td>{item.registrationNo}</td>
                          <td>{item.billNo}</td>
                          <td>{item.patientName}</td>
                          <td>{item.mobileNo}</td>
                          <td>
                            {item.age}/{item.sex}
                          </td>
                          <td>{item.relation}</td>
                          <td>{item.department}</td>
                          <td>{formatDate(item.billDate)}</td>
                          <td>
                            ₹
                            {typeof item.amount === "number"
                              ? item.amount.toFixed(2)
                              : item.amount}
                          </td>
                          <td>
                            <span
                              className={`badge ${getBillingTypeBadge(item.billingType)}`}
                            >
                              {item.billingType}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => handleViewReport(item)}
                                disabled={
                                  isGeneratingPdf(item.id) ||
                                  isPrinting(item.id)
                                }
                                title="View Report"
                              >
                                {isGeneratingPdf(item.id) ? (
                                  <>
                                    <span
                                      className="spinner-border spinner-border-sm me-1"
                                      role="status"
                                      aria-hidden="true"
                                    ></span>
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <i className="mdi mdi-eye me-1"></i> View
                                  </>
                                )}
                              </button>
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => handlePrintReport(item)}
                                disabled={
                                  isGeneratingPdf(item.id) ||
                                  isPrinting(item.id)
                                }
                                title="Print Report"
                              >
                                {isPrinting(item.id) ? (
                                  <>
                                    <span
                                      className="spinner-border spinner-border-sm me-1"
                                      role="status"
                                      aria-hidden="true"
                                    ></span>
                                    Printing...
                                  </>
                                ) : (
                                  <>
                                    <i className="mdi mdi-printer me-1"></i>{" "}
                                    Print
                                  </>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {patientList.length > 0 && (
                    <Pagination
                      totalItems={totalElements}
                      itemsPerPage={itemsPerPage}
                      currentPage={currentPage + 1}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientwiseBilldatails;