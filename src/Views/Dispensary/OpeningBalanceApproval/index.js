import { useState, useRef, useEffect } from "react"
import Popup from "../../../Components/popup"
import { API_HOST, MAS_DEPARTMENT, MAS_BRAND, MAS_MANUFACTURE, OPEN_BALANCE, MAS_DRUG_MAS } from "../../../config/apiConfig";
import { getRequest, putRequest } from "../../../service/apiService"
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { ALL_REPORTS } from "../../../config/apiConfig";
import PdfViewer from "../../../Components/PdfViewModel/PdfViewer";
import { LAB_REPORT_GENERATION_ERR_MSG, LAB_REPORT_PRINT_ERR_MSG, INVALID_ORDER_ID_ERR_MSG, SELECT_DATE_WARN_MSG, FETCH_LAB_HISTORY_REPORT_ERR_MSG, INVALID_DATE_PICK_WARN_MSG } from '../../../config/constants';




const OpeningBalanceApproval = () => {
  const [currentView, setCurrentView] = useState("list") // "list" or "detail"
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [loading, setLoading] = useState(true);
  const [approvalData, setApprovalData] = useState([]);
  const [action, setAction] = useState("");
  const [remark, setRemark] = useState("");
  const [popupMessage, setPopupMessage] = useState(null)
  const hospitalId = sessionStorage.getItem("hospitalId") || localStorage.getItem("hospitalId");
  const departmentId = sessionStorage.getItem("departmentId") || localStorage.getItem("departmentId");
  const [printingIds, setPrintingIds] = useState(new Set());

  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfSelectedRecord, setPdfSelectedRecord] = useState(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);



  const fetchOpenBalance = async () => {
    try {
      setLoading(true);
      const status = "a";
      const response = await getRequest(`${OPEN_BALANCE}/list/${status}/${hospitalId}/${departmentId}`);

      if (response && Array.isArray(response)) {

        setApprovalData(response);
        console.log("Transformed approval data:", response);
      }
    } catch (err) {
      console.error("Error fetching drug options:", err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchOpenBalance();
  }, []);

  useEffect(() => {
    console.log("approvalData updated:", approvalData);
  }, [approvalData]);


  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState("")



  const [detailEntries, setDetailEntries] = useState([])

  // Helper to format date to yyyy-mm-dd
  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  };

  // Filtered data based on date range (only when both dates are present)
  const filteredApprovalData = approvalData.filter((item) => {
    if (!fromDate || !toDate) return true;
    const itemDate = formatDate(item.enteredDt);
    const from = formatDate(fromDate);
    const to = formatDate(toDate);
    return itemDate >= from && itemDate <= to;
  });

  const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = filteredApprovalData.slice(indexOfFirst, indexOfLast);


  const handleEdit = (item) => {
    setSelectedRecord(item)
    setDetailEntries(item.openingBalanceDtResponseList)
    setCurrentView("detail")
  }

  const handleBackToList = () => {
    setCurrentView("list")
    setSelectedRecord(null)
  }

  const handleSearch = () => {
    console.log("Searching from", fromDate, "to", toDate)
  }
  const isPrinting = (recordId) => {
    return printingIds.has(recordId);
  };

  const handleShowAll = () => {
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
  }


  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null)
      },
    })
  }

  const handleViewDownload = (record) => {
    console.log("View report for:", record);
    generateOpeningBalancePdf(record);
  };



  // Generate PDF for viewing
  const generateOpeningBalancePdf = async (record) => {
    const balanceMId = record.balanceMId;

    if (!balanceMId) {
      showPopup("Invalid Balance ID for generating report", "error");
      return;
    }

    // Clear previous PDF and show loading
    setIsGeneratingPdf(true);
    setPdfUrl(null);
    setPdfSelectedRecord(null);

    try {
      // Build the PDF URL (adjust this according to your API endpoint)
      const url = `${ALL_REPORTS}/openingBalanceReport?balanceMId=${balanceMId}&flag=d`;

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

      // Set PDF URL and record details to trigger the viewer
      setPdfUrl(fileURL);
      setPdfSelectedRecord({
        balanceNo: record.balanceNo,
        departmentName: record.departmentName,
        enteredDt: record.enteredDt,
      });

    } catch (error) {
      console.error("Error generating PDF", error);
      showPopup("Error generating PDF report. Please try again.", "error");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrintReport = async (record) => {
    const balanceMId = record.balanceMId;


    if (!balanceMId) {
      showPopup(`${INVALID_ORDER_ID_ERR_MSG} for printing`, "error");
      return;
    }

    // Add this record to printing set
    setPrintingIds(prev => new Set(prev).add(balanceMId));

    try {
      const url = `${ALL_REPORTS}/openingBalanceReport?balanceMId=${balanceMId}&flag=p`;


      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/pdf",
        },
      });

      if (response.status === 200) {
        // showPopup("Report sent to printer successfully!", "success");
      } else {
        showPopup(LAB_REPORT_PRINT_ERR_MSG, "error");
      }
    } catch (error) {
      console.error("Error printing report", error);
      showPopup(LAB_REPORT_PRINT_ERR_MSG, "error");
    } finally {
      // Remove this record from printing set
      setPrintingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(balanceMId);
        return newSet;
      });
    }
  };

  const handleSubmit = async () => {
    console.log("Submitting id:", selectedRecord.balanceMId);

    const payload = {
      remark: remark || "",
      status: action || "",
    };

    try {
      const response = await putRequest(`${OPEN_BALANCE}/Approved/${selectedRecord.balanceMId}`, payload);
      setCurrentView("list");
      setSelectedRecord(null);
      showPopup(
        `${payload.status === "a" ? "Approved" : "Rejected"} successfully!`,
        "success"
      );
      await fetchOpenBalance();
      setSelectedRecord(null);
      setDetailEntries([]);
      setCurrentView("list");


    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };






  if (currentView === "detail") {
    return (

      <div className="content-wrapper">
        {pdfUrl && pdfSelectedRecord && (
          <PdfViewer
            pdfUrl={pdfUrl}
            onClose={() => {
              setPdfUrl(null);
              setPdfSelectedRecord(null);
            }}
            name={`Opening Balance Report - ${pdfSelectedRecord?.balanceNo || ''} (${pdfSelectedRecord?.departmentName || 'Department'})`}
          />
        )}
        <div className="row">
          <div className="col-12 grid-margin stretch-card">
            <div className="card form-card">
              {/* Header Section */}
              <div className="card-header d-flex justify-content-between align-items-center">
                <h4 className="card-title p-2 mb-0">Entry Details</h4>
                <button type="button" className="btn btn-secondary" onClick={handleBackToList}>
                  Back to List
                </button>
              </div>

              <div className="card-body">
                {/* Entry Details Header */}
                <div className="row mb-4">
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Balance Entry Date</label>
                    <input
                      type="text"
                      className="form-control"
                      value={
                        selectedRecord?.enteredDt
                          ? new Date(selectedRecord.enteredDt).toLocaleDateString("en-GB")
                          : ""
                      }

                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Balance Entry Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.balanceNo || ""}
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Entered By</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.enteredBy || ""}
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Department</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.departmentName || ""}
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
                  </div>
                  <div className="col-md-2 mt-3">
                    <button
                      className="btn btn-success"
                      onClick={() => handleViewDownload(selectedRecord)}
                      disabled={isGeneratingPdf}
                    >
                      {isGeneratingPdf ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Generating...
                        </>
                      ) : (
                        "View/Download"
                      )}
                    </button>
                  </div>
                  <div className="col-md-2 mt-3">
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => handlePrintReport(selectedRecord)}
                    >
                      {isPrinting(selectedRecord.id) ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                          Printing...
                        </>
                      ) : (
                        "Print"
                      )}
                    </button>
                  </div>
                </div>

                {/* Detail Table */}
                <div className="table-responsive" style={{ maxHeight: "500px", overflowY: "auto" }}>
                  <table className="table table-bordered align-middle">
                    <thead style={{ backgroundColor: "#6c7b7f", color: "white" }}>
                      <tr>
                        <th className="text-center" style={{ width: "60px", minWidth: "60px" }}>
                          S.No.
                        </th>
                        <th style={{ width: "120px", minWidth: "120px" }}>Drug Code</th>
                        <th style={{ width: "200px", minWidth: "270px" }}>Drug Name</th>
                        <th style={{ width: "80px", minWidth: "80px" }}>Unit</th>
                        <th style={{ width: "150px", minWidth: "150px" }}>Batch No/ Serial No</th>
                        <th style={{ width: "120px", minWidth: "120px" }}>DOM</th>
                        <th style={{ width: "120px", minWidth: "120px" }}>DOE</th>
                        <th style={{ width: "80px", minWidth: "80px" }}>Qty</th>
                        <th style={{ width: "100px", minWidth: "100px" }}>Units Per Pack</th>
                        <th style={{ width: "120px", minWidth: "120px" }}>Purchase Rate/Unit</th>
                        <th style={{ width: "100px", minWidth: "100px" }}>GST Percent</th>
                        <th style={{ width: "100px", minWidth: "100px" }}>MRP/Unit</th>
                        <th style={{ width: "100px", minWidth: "100px" }}>Total Cost</th>
                        <th style={{ width: "150px", minWidth: "150px" }}>Brand Name</th>
                        <th style={{ width: "150px", minWidth: "150px" }}>Manufacturer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailEntries.map((entry, index) => (
                        <tr key={entry.balanceMId}>
                          <td className="text-center">
                            <input
                              type="text"
                              className="form-control text-center"
                              value={index + 1}
                              style={{ width: "50px", backgroundColor: "#e9ecef" }}
                              readOnly
                              disabled
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={entry.itemCode}
                              style={{ width: "110px", backgroundColor: "#e9ecef" }}
                              readOnly
                              disabled
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={entry.itemName}
                              style={{ width: "190px", backgroundColor: "#e9ecef" }}
                              readOnly
                              disabled
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={entry.itemUnit}
                              style={{ width: "70px", backgroundColor: "#e9ecef" }}
                              readOnly
                              disabled
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={entry.batchNo}
                              style={{ width: "140px", backgroundColor: "#e9ecef" }}
                              readOnly
                              disabled
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="DD/MM/YYYY"
                              value={entry.manufactureDate}
                              style={{ width: "110px", backgroundColor: "#e9ecef" }}
                              readOnly
                              disabled
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="DD/MM/YYYY"
                              value={entry.expiryDate}
                              style={{ width: "110px", backgroundColor: "#e9ecef" }}
                              readOnly
                              disabled
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control"
                              value={entry.qty}
                              style={{ width: "70px", backgroundColor: "#e9ecef" }}
                              readOnly
                              disabled
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control"
                              value={entry.unitsPerPack || ""}
                              style={{ width: "90px", backgroundColor: "#e9ecef" }}
                              readOnly
                              disabled
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control"
                              value={entry.purchaseRatePerUnit || ""}
                              style={{ width: "110px", backgroundColor: "#e9ecef" }}
                              readOnly
                              disabled
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control"
                              value={entry.gstPercent || ""}
                              style={{ width: "90px", backgroundColor: "#e9ecef" }}
                              readOnly
                              disabled
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control"
                              value={entry.mrpPerUnit || ""}
                              style={{ width: "90px", backgroundColor: "#e9ecef" }}
                              readOnly
                              disabled
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={entry.totalPurchaseCost || ""}
                              readOnly
                              disabled
                              style={{ backgroundColor: "#e9ecef", minWidth: "90px" }}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={entry.manufacturerName || ""}
                              style={{ minWidth: "190px", backgroundColor: "#e9ecef" }}
                              readOnly
                              disabled
                            />

                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={entry.brandName || ""}
                              style={{ minWidth: "190px", backgroundColor: "#e9ecef" }}
                              readOnly
                              disabled
                            />
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="row mb-3 mt-3">
                  <div className="col-md-4">
                    <label className="form-label fw-bold mb-1">Action</label>
                    <select
                      className="form-select"
                      value={action}
                      onChange={(e) => setAction(e.target.value)}
                    >
                      <option value="">Select Action</option>
                      <option value="a">Approve</option>
                      <option value="r">Reject</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold mb-1">Remark</label>
                    <input
                      type="text"
                      className="form-control"
                      style={{ height: "100px" }}
                      placeholder="Enter your remark here"
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="d-flex justify-content-end mt-4">
                  <button
                    type="button"
                    className="btn me-2"
                    style={{ backgroundColor: "#e67e22", color: "white" }}
                    onClick={handleSubmit}
                  >

                    {action === "a" ? "Approve" : action === "r" ? "Reject" : "Submit"}

                  </button>
                  <button type="button" className="btn btn-danger" onClick={handleBackToList} >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="content-wrapper">
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            {/* Header Section */}
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">Opening Balance Approval Report</h4>
            </div>

            <div className="card-body">
              {/* Date Filter Section */}
              <div className="row mb-4">
                <div className="col-md-3">
                  <label className="form-label fw-bold">From Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={fromDate}
                    onChange={(e) => {
                      setFromDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    max={toDate || undefined}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold">To Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={toDate}
                    onChange={(e) => {
                      setToDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    min={fromDate || undefined}
                  />
                </div>
                <div className="col-md-3 d-flex align-items-end"></div>
                <div className="col-md-3 d-flex justify-content-end align-items-end">
                  <button type="button" className="btn btn-success" onClick={handleShowAll}>
                    Show All
                  </button>
                </div>
              </div>

              {/* Table Section */}
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead style={{ backgroundColor: "#95a5a6", color: "white" }}>
                    <tr>
                      <th>Balance No.</th>
                      <th>Opening Balance Date</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Submitted By</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((item) => (
                      <tr key={item.balanceMId}>
                        <td>{item.balanceNo}</td>
                        <td>{new Date(item.enteredDt).toLocaleDateString("en-GB")}</td>
                        <td>{item.departmentName}</td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: item.status === "p" ? "#ffc107" : item.status === "a" ? "#28a745" : "#6c757d",
                              color: item.status === "p" ? "#000" : "#fff",
                            }}
                          >
                            {item.status === "p"
                              ? "Pending for Approval"
                              : item.status === "a"
                                ? "Approved"
                                : item.status}
                          </span>
                        </td>
                        <td>{item.enteredBy}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-success me-2"
                            onClick={() => handleEdit(item)}
                          >
                            <i className="fa fa-eye"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <Pagination
                totalItems={filteredApprovalData.length}
                itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OpeningBalanceApproval
