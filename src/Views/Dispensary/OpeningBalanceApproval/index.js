import { useState, useEffect, useCallback } from "react"
import { useNavigate } from 'react-router-dom';
import LoadingScreen from "../../../Components/Loading"
import ConfirmationPopup from "../../../Components/ConfirmationPopup";
import PdfViewer from "../../../Components/PdfViewModel/PdfViewer"
import { GET_OPENING_BALANCE_ENTRY_HEADERS_WITHOUT_PAGINATION, REQUEST_PARAM_HOSPITAL_ID, REQUEST_PARAM_DEPARTMENT_ID, GET_OPENING_BALANCE_ENTRY_DETAILS, APPROVE_OPENING_BALANCE_ENTRY, OPENING_BALANCE_REPORT_URL, REQUEST_PARAM_BALANCE_M_ID, STATUS_D } from "../../../config/apiConfig";
import { getRequest, putRequest, fetchPdfReportForViewAndPrint } from "../../../service/apiService"
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import {formatDateForDisplay} from "../../../utils/dateUtils";
import {
  WARNING_SELECT_ACTION, WARNING_REMARKS_MANDATORY, CONFIRM_OPENING_BALANCE_ACTION, CONFIRM_OPENING_BALANCE_RESULT, ERROR_PROCESS_REQUEST_FAILED,
  OPENING_BALANCE_APPROVE_TITLE,
  OPENING_BALANCE_APPROVE_FILE_NAME,
  OPENING_BALANCE_NOT_FOUND,
  FETCH_OPENING_BALANCE_DEATAILS_ERR_MSG,
  REPORT_GEN_FAILED_ERR_MSG,
} from '../../../config/constants';

const OpeningBalanceApproval = () => {
  const [currentView, setCurrentView] = useState("list") // "list" or "detail"
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [approvalData, setApprovalData] = useState([]);
  const [action, setAction] = useState("");
  const [remark, setRemark] = useState("");
  const [confirmationPopup, setConfirmationPopup] = useState(null);
  
  // States for PDF report viewer
  const [reportPdfUrl, setReportPdfUrl] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  
  const hospitalId = sessionStorage.getItem("hospitalId") || localStorage.getItem("hospitalId");
  const departmentId = sessionStorage.getItem("departmentId") || localStorage.getItem("departmentId");

  const navigate = useNavigate();

  // Confirmation Popup Helper Function
  const showConfirmationPopup = (message, type, onConfirm, onCancel = null, confirmText = "Yes", cancelText = "No") => {
    setConfirmationPopup({
      message,
      type,
      onConfirm: () => {
        onConfirm();
        setConfirmationPopup(null);
      },
      onCancel: onCancel ? () => {
        onCancel();
        setConfirmationPopup(null);
      } : () => setConfirmationPopup(null),
      confirmText,
      cancelText
    });
  };

  const fetchOpenBalanceHeaders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getRequest(`${GET_OPENING_BALANCE_ENTRY_HEADERS_WITHOUT_PAGINATION}?${REQUEST_PARAM_HOSPITAL_ID}=${hospitalId}&${REQUEST_PARAM_DEPARTMENT_ID}=${departmentId}`);

      if (response && response.response && Array.isArray(response.response)) {
        setApprovalData(response.response);
        console.log("Transformed approval data:", response.response);
      }
    } catch (err) {
      console.error("Error fetching opening balance headers:", err);
    } finally {
      setLoading(false);
    }
  }, [hospitalId, departmentId]);

  useEffect(() => {
    fetchOpenBalanceHeaders();
  }, [fetchOpenBalanceHeaders]);

  useEffect(() => {
    console.log("approvalData updated:", approvalData);
  }, [approvalData]);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1)

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

  // Function to fetch details when editing a record
  const fetchOpeningBalanceDetails = async (balanceMId) => {
    try {
      const response = await getRequest(`${GET_OPENING_BALANCE_ENTRY_DETAILS}/${balanceMId}`);
      
      if (response && response.response && Array.isArray(response.response)) {
        setDetailEntries(response.response);
        console.log("Fetched details:", response.response);
      }
    } catch (err) {
      console.error("Error fetching opening balance details:", err);
      showConfirmationPopup(FETCH_OPENING_BALANCE_DEATAILS_ERR_MSG, "error", () => {});
    }
  };

  const handleEdit = async (item) => {
    setSelectedRecord(item);
    await fetchOpeningBalanceDetails(item.balanceMId);
    setCurrentView("detail");
  };

  const handleBackToList = () => {
    setCurrentView("list");
    setSelectedRecord(null);
    setDetailEntries([]);
    setAction("");
    setRemark("");
    setReportPdfUrl(null); // Close PDF viewer if open
  };

  const handleShowAll = () => {
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
  };

  // Helper function to handle the actual submit logic
  const handleSubmitLogic = async () => {
    if (!action) {
      showConfirmationPopup(WARNING_SELECT_ACTION, "warning", () => {});
      return { success: false, message: "Please select an action" };
    }

    if (!remark.trim()) {
      showConfirmationPopup(WARNING_REMARKS_MANDATORY, "warning", () => {});
      return { success: false, message: "Remarks are mandatory" };
    }

    const payload = {
      remark: remark || "",
      status: action || "",
    };

    try {
      setIsProcessing(true);
      const response = await putRequest(`${APPROVE_OPENING_BALANCE_ENTRY}/${selectedRecord.balanceMId}`, payload);
      return { success: true, response, balanceMId: selectedRecord.balanceMId };
    } catch (error) {
      console.error("Error submitting data:", error);
      return { success: false, message: "Failed to process the request. Please try again." };
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Submit
  const handleSubmit = async () => {
    const actionText = action === "a" ? "approve" : action === "r" ? "reject" : "submit";
    const actionDisplayText = action === "a" ? "Approve" : action === "r" ? "Reject" : "Submit";
    
    showConfirmationPopup(
      CONFIRM_OPENING_BALANCE_ACTION(actionText),
      "info",
      async () => {
        const result = await handleSubmitLogic();
        
        if (result?.success) {
          const balanceMId = result.balanceMId;
          
          showConfirmationPopup(
            CONFIRM_OPENING_BALANCE_RESULT(action),
            "success",
            () => {
              if (balanceMId) {
                navigate('/ViewDownloadReport', {
                  state: {
                    reportUrl: `${OPENING_BALANCE_REPORT_URL}?${REQUEST_PARAM_BALANCE_M_ID}=${balanceMId}`,
                    title: OPENING_BALANCE_APPROVE_TITLE(action),
                    fileName: OPENING_BALANCE_APPROVE_FILE_NAME(action),
                    returnPath: window.location.pathname
                  }
                });
              }
              
              fetchOpenBalanceHeaders();
              setCurrentView("list");
              setSelectedRecord(null);
              setAction("");
              setRemark("");
            },
            () => {
              fetchOpenBalanceHeaders();
              setCurrentView("list");
              setSelectedRecord(null);
              setAction("");
              setRemark("");
            },
            "Yes",
            "No"
          );
        } else {
          showConfirmationPopup(
            result?.message || ERROR_PROCESS_REQUEST_FAILED,
            "error",
            () => {},
            null,
            "OK",
            "Close"
          );
        }
      },
      () => {
        console.log(`${actionText} cancelled by user`);
      },
      `${actionDisplayText}`,
      "Cancel"
    );
  };

  // Handle Report button click - Same as IndentViewUpdate (inline PDF viewer)
  const handleReportClick = async () => {
    const balanceMId = selectedRecord?.balanceMId;
    if (balanceMId) {
      try {
        setIsGeneratingReport(true);
        const reportUrl = `${OPENING_BALANCE_REPORT_URL}?${REQUEST_PARAM_BALANCE_M_ID}=${balanceMId}`;
        const blob = await fetchPdfReportForViewAndPrint(reportUrl, STATUS_D);
        const fileURL = window.URL.createObjectURL(blob);
        setReportPdfUrl(fileURL);
      } catch (error) {
        console.error("Error generating report:", error);
        showConfirmationPopup(REPORT_GEN_FAILED_ERR_MSG, "error", () => {});
      } finally {
        setIsGeneratingReport(false);
      }
    } else {
      showConfirmationPopup(OPENING_BALANCE_NOT_FOUND, "error", () => {});
    }
  };

  if (currentView === "detail") {
    return (
      <div className="content-wrapper">
        {/* PDF Viewer Modal - Same as IndentViewUpdate */}
        {reportPdfUrl && (
          <PdfViewer
            pdfUrl={reportPdfUrl}
            name="Opening Balance Report"
            onClose={() => setReportPdfUrl(null)}
          />
        )}
        
        <ConfirmationPopup
          show={confirmationPopup !== null}
          message={confirmationPopup?.message || ''}
          type={confirmationPopup?.type || 'info'}
          onConfirm={confirmationPopup?.onConfirm || (() => {})}
          onCancel={confirmationPopup?.onCancel}
          confirmText={confirmationPopup?.confirmText || 'OK'}
          cancelText={confirmationPopup?.cancelText}
        />
        
        <div className="row">
          <div className="col-12 grid-margin stretch-card">
            <div className="card form-card">
              {/* Header Section */}
              <div className="card-header d-flex justify-content-between align-items-center">
                <h4 className="card-title p-2 mb-0">Opening Balance Entry Details</h4>
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

                  <div className="col-md-3 mt-3">
                    <label className="form-label fw-bold">Balance Type</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.balanceType || ""}
                      style={{ backgroundColor: "#e9ecef" }}
                      readOnly
                    />
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
                      {detailEntries.length === 0 ? (
                        <tr>
                          <td colSpan={15} className="text-center text-muted py-4">
                            No details found for this opening balance entry.
                          </td>
                        </tr>
                      ) : (
                        detailEntries.map((entry, index) => (
                          <tr key={entry.balanceTId || index}>
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
                                value={formatDateForDisplay(entry.manufactureDate)}
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
                                value={formatDateForDisplay(entry.expiryDate)}
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
                                value={entry.brandName || ""}
                                style={{ minWidth: "190px", backgroundColor: "#e9ecef" }}
                                readOnly
                                disabled
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
                          </tr>
                        ))
                      )}
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
                      disabled={isProcessing}
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
                      disabled={isProcessing}
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-end mt-4">
                  <button
                    type="button"
                    className="btn btn-info me-2"
                    onClick={handleReportClick}
                    style={{ color: "white" }}
                    disabled={isProcessing || isGeneratingReport}
                  >
                    {isGeneratingReport ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Generating...
                      </>
                    ) : (
                      "Report"
                    )}
                  </button>
                  
                  <button
                    type="button"
                    className="btn me-2 btn-success"
                    onClick={handleSubmit}
                    disabled={isProcessing || !action}
                  >
                    {isProcessing ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        {action === "a" ? "Approving..." : action === "r" ? "Rejecting..." : "Submitting..."}
                      </>
                    ) : (
                      action === "a" ? "Approve" : action === "r" ? "Reject" : "Submit"
                    )}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-danger" 
                    onClick={handleBackToList}
                    disabled={isProcessing}
                  >
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
      {loading && <LoadingScreen />}
      <ConfirmationPopup
        show={confirmationPopup !== null}
        message={confirmationPopup?.message || ''}
        type={confirmationPopup?.type || 'info'}
        onConfirm={confirmationPopup?.onConfirm || (() => {})}
        onCancel={confirmationPopup?.onCancel}
        confirmText={confirmationPopup?.confirmText || 'OK'}
        cancelText={confirmationPopup?.cancelText}
      />
      
      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            {/* Header Section */}
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">Opening Balance Approval List</h4>
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
                  <button type="button" className="btn btn-secondary" onClick={handleShowAll}>
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
                      <th>Submitted By</th> 
                      <th>Drug / Non Drug</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApprovalData.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center text-muted py-4">
                          {loading ? "Loading..." : "No pending opening balance entry is found"}
                        </td>
                      </tr>
                    ) : (
                      currentItems.map((item) => (
                        <tr key={item.balanceMId}>
                          <td>{item.balanceNo}</td>
                          <td>{new Date(item.enteredDt).toLocaleDateString("en-GB")}</td>
                          <td>{item.departmentName}</td>
                          <td>{item.enteredBy}</td>
                          <td>{item.balanceType}</td>
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
                          <td>
                            <button
                              className="btn btn-sm btn-success me-2"
                              onClick={() => handleEdit(item)}
                            >
                              <i className="fa fa-eye"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination - Only show if there is data */}
              {filteredApprovalData.length > 0 && (
                <Pagination
                  totalItems={filteredApprovalData.length}
                  itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OpeningBalanceApproval