import { useState, useEffect } from "react";
import { getRequest } from "../../../../service/apiService";
import LoadingScreen from "../../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../../Components/Pagination";
import Popup from "../../../../Components/popup";
import PdfViewer from "../../../../Components/PdfViewModel/PdfViewer";
import { ALL_REPORTS } from "../../../../config/apiConfig";
import { INVALID_DATE_PICK_WARN_MSG, SELECT_DATE_WARN_MSG, LAB_REPORT_GENERATION_ERR_MSG, INVALID_ORDER_ID_ERR_MSG, FUTURE_DATE_PICK_WARN_MSG, PAST_DATE_PICK_WARN_MSG, SELECT_FROM_DATE_FIRST_WARN_MSG, FETCH_ORDER_TRACKING_ERR_MSG, SELECT_FIELD_WARN_MSG } from "../../../../config/constants";

const OrderTrackingReport = () => {
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [patientName, setPatientName] = useState("");
    const [mobileNo, setMobileNo] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [popupMessage, setPopupMessage] = useState(null);
    const [reportData, setReportData] = useState([]);

    // Add PDF viewing states
    const [pdfUrl, setPdfUrl] = useState(null);
    const [selectedRecord, setSelectedRecord] = useState(null);
    
    // Track loading states for individual reports
    const [generatingPdfIds, setGeneratingPdfIds] = useState(new Set());

    // Function to get today's date in YYYY-MM-DD format
    const getTodayDate = () => {
        return new Date().toISOString().split('T')[0];
    };

    // Function to get one week ago date
    const getOneWeekAgoDate = () => {
        const today = new Date();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(today.getDate() - 7);
        return oneWeekAgo.toISOString().split('T')[0];
    };

    // Popup function
    const showPopup = (message, type = "info") => {
        setPopupMessage({
            message,
            type,
            onClose: () => {
                setPopupMessage(null);
            },
        });
    };

    // Format date for display (DD-MM-YYYY)
    const formatDateForDisplay = (dateString) => {
        if (!dateString) return "";
        try {
            const date = new Date(dateString);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        } catch (error) {
            console.error("Error formatting date:", error);
            return "";
        }
    };

    // Handle from date change
    const handleFromDateChange = (e) => {
        const selectedDate = e.target.value;
        const today = getTodayDate();

        if (selectedDate > today) {
            showPopup(FUTURE_DATE_PICK_WARN_MSG, "Warning");
            setFromDate(today);
            return;
        }

        if (toDate && selectedDate > toDate) {
            showPopup(INVALID_DATE_PICK_WARN_MSG, "Warning");
            setFromDate(toDate);
            return;
        }

        setFromDate(selectedDate);
    };

    // Handle to date change
    const handleToDateChange = (e) => {
        const selectedDate = e.target.value;
        const today = getTodayDate();

        if (selectedDate > today) {
            showPopup(FUTURE_DATE_PICK_WARN_MSG, "Warning");
            setToDate(today);
            return;
        }

        if (fromDate && selectedDate < fromDate) {
            showPopup(PAST_DATE_PICK_WARN_MSG, "Warning");
            setToDate(fromDate);
            return;
        }

        // Validate 7-day limit
        const fromDateObj = new Date(fromDate);
        const toDateObj = new Date(selectedDate);
        const diffTime = Math.abs(toDateObj - fromDateObj);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 7) {
            showPopup("Date range cannot exceed 7 days", "error");
            return;
        }

        setToDate(selectedDate);
    };

    // Handle to date focus
    const handleToDateFocus = (e) => {
        if (!fromDate) {
            e.preventDefault();
            e.target.blur();
            showPopup(SELECT_FROM_DATE_FIRST_WARN_MSG, "Warning");
        }
    };

    // Check if at least one of patient name or mobile number is provided
    const hasPatientInfo = () => {
        return patientName.trim() !== "" || mobileNo.trim() !== "";
    };

    // Check if all required fields are filled for search
    const canSearch = () => {
        return fromDate && toDate && hasPatientInfo();
    };

    // Check if report can be viewed/printed
    const canViewPrintReport = () => {
        return fromDate && toDate && hasPatientInfo() && showReport;
    };

    // Helper function to check if a record is generating PDF
    const isGeneratingPdf = (dgOrderHdId) => {
        return generatingPdfIds.has(dgOrderHdId);
    };

    // Generate lab report for viewing/downloading
    const generateLabReport = async (record) => {
        const dgOrderHdId = record.dgOrderHdId;

        if (!dgOrderHdId) {
            showPopup(`${INVALID_ORDER_ID_ERR_MSG} for generating report`, "error");
            return;
        }

        // Add this record to generating set
        setGeneratingPdfIds(prev => new Set(prev).add(dgOrderHdId));
        setPdfUrl(null);
        setSelectedRecord(record);

        try {
            // Use flag='d' for download/view
            const url = `${ALL_REPORTS}/labInvestigationReport?orderhd_id=${dgOrderHdId}&flag=d`;

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
            showPopup(LAB_REPORT_GENERATION_ERR_MSG, "error");
        } finally {
            // Remove this record from generating set
            setGeneratingPdfIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(dgOrderHdId);
                return newSet;
            });
        }
    };

    

    // View report handler for individual records
    const handleViewReport = (record) => {
        generateLabReport(record);
    }

    // Fetch order tracking report
    const fetchOrderTrackingReport = async () => {
        try {
            setIsSearching(true);
            
            const params = new URLSearchParams();
            if (patientName.trim()) {
                params.append('patientName', patientName.trim());
            }
            if (mobileNo.trim()) {
                params.append('mobileNo', mobileNo.trim());
            }
            params.append('fromDate', fromDate);
            params.append('toDate', toDate);

            const response = await getRequest(`/report/order-track-report?${params.toString()}`);
            
            if (response && response.response) {
                const mappedData = response.response.map(item => ({
                    dgOrderHdId: item.dgOrderHdId,
                    orderNo: item.orderNum || "",
                    orderDate: formatDateForDisplay(item.orderDate) || "",
                    patientName: item.patientName || "",
                    mobileNo: item.mobileNum || "",
                    ageGender: `${item.age || ""} / ${item.gender || ""}`,
                    sampleId: item.generatedSampleId || "",
                    investigationName: item.investigationName || "",
                    investigationStatus: item.orderStatusName || "N/A",
                    report: item.orderStatusId === 6 ? "View / Download" : "—"
                }));
                
                setReportData(mappedData);
                setShowReport(true);
            } else {
                setReportData([]);
                setShowReport(true);
            }
        } catch (error) {
            console.error("Error fetching order tracking report:", error);
            showPopup(FETCH_ORDER_TRACKING_ERR_MSG, "error");
            setReportData([]);
            setShowReport(true);
        } finally {
            setIsSearching(false);
        }
    };

    // Handle search
    const handleSearch = () => {
        // Validate required fields
        if (!fromDate || !toDate) {
            showPopup(SELECT_DATE_WARN_MSG, "warning");
            return;
        }

        // Validate that at least one of patient name or mobile number is provided
        if (!hasPatientInfo()) {
            showPopup(SELECT_FIELD_WARN_MSG, "warning");
            return;
        }

        // Validate that from date is not after to date
        if (new Date(fromDate) > new Date(toDate)) {
            showPopup(INVALID_DATE_PICK_WARN_MSG, "warning");
            return;
        }

        // Validate 7-day limit
        const fromDateObj = new Date(fromDate);
        const toDateObj = new Date(toDate);
        const diffTime = Math.abs(toDateObj - fromDateObj);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 7) {
            showPopup("Date range cannot exceed 7 days", "error");
            return;
        }

        fetchOrderTrackingReport();
        setCurrentPage(1);
    };

    // Handle view report (main button)
    const handleViewReportMain = () => {
        // Validate required fields
        if (!fromDate || !toDate) {
            showPopup(SELECT_DATE_WARN_MSG, "warning");
            return;
        }

        // Validate that at least one of patient name or mobile number is provided
        if (!hasPatientInfo()) {
            showPopup(SELECT_FIELD_WARN_MSG, "warning");
            return;
        }

        // Validate that from date is not after to date
        if (new Date(fromDate) > new Date(toDate)) {
            showPopup(INVALID_DATE_PICK_WARN_MSG, "warning");
            return;
        }

        // Validate 7-day limit
        const fromDateObj = new Date(fromDate);
        const toDateObj = new Date(toDate);
        const diffTime = Math.abs(toDateObj - fromDateObj);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 7) {
            showPopup("Date range cannot exceed 7 days", "error");
            return;
        }

        // Only fetch if we don't already have data
        if (!showReport || reportData.length === 0) {
            fetchOrderTrackingReport();
        }
        setCurrentPage(1);
    };

    // Handle print report (main button)
    const handlePrintReportMain = async () => {
        // Validate required fields
        if (!fromDate || !toDate) {
            showPopup(SELECT_DATE_WARN_MSG, "warning");
            return;
        }

        // Validate that at least one of patient name or mobile number is provided
        if (!hasPatientInfo()) {
            showPopup(SELECT_FIELD_WARN_MSG, "warning");
            return;
        }

        // Validate that from date is not after to date
        if (new Date(fromDate) > new Date(toDate)) {
            showPopup(INVALID_DATE_PICK_WARN_MSG, "warning");
            return;
        }

        // Validate 7-day limit
        const fromDateObj = new Date(fromDate);
        const toDateObj = new Date(toDate);
        const diffTime = Math.abs(toDateObj - fromDateObj);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 7) {
            showPopup("Date range cannot exceed 7 days", "error");
            return;
        }

        // If no report data exists, fetch it first
        if (!showReport || reportData.length === 0) {
            setIsGenerating(true);
            await fetchOrderTrackingReport();
        }

        // Now print the report
        setIsPrinting(true);
        setTimeout(() => {
            showPopup("Order Tracking Report would be printed here", "info");
            setIsPrinting(false);
        }, 1000);
    };

    // Handle reset
    const handleReset = () => {
        const today = getTodayDate();
        const oneWeekAgo = getOneWeekAgoDate();
        
        setFromDate(oneWeekAgo);
        setToDate(today);
        setPatientName("");
        setMobileNo("");
        setShowReport(false);
        setReportData([]);
        setCurrentPage(1);
        setPdfUrl(null);
        setSelectedRecord(null);
    };

    // Initialize with default dates
    useEffect(() => {
        const today = getTodayDate();
        const oneWeekAgo = getOneWeekAgoDate();
        
        setFromDate(oneWeekAgo);
        setToDate(today);
    }, []);

    // Calculate pagination
    const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
    const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
    const currentItems = reportData.slice(indexOfFirst, indexOfLast);

    return (
        <div className="content-wrapper">
            {/* Add PDF Viewer Component */}
            {pdfUrl && selectedRecord && (
                <PdfViewer
                    pdfUrl={pdfUrl}
                    onClose={() => {
                        setPdfUrl(null);
                        setSelectedRecord(null);
                    }}
                    name={`Lab Report - ${selectedRecord?.patientName || 'Patient'}`}
                />
            )}

            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header">
                            <h4 className="card-title p-2 mb-0">ORDER TRACKING REPORT</h4>
                        </div>
                        <div className="card-body">
                            <div className="row mb-4">
                                <div className="col-md-3">
                                    <label className="form-label fw-bold">
                                        From Date <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={fromDate}
                                        max={getTodayDate()}
                                        onChange={handleFromDateChange}
                                        required
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label fw-bold">
                                        To Date <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={toDate}
                                        min={fromDate}
                                        max={getTodayDate()}
                                        onChange={handleToDateChange}
                                        disabled={!fromDate}
                                        onFocus={handleToDateFocus}
                                        required
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label fw-bold">
                                        Patient Name
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={patientName}
                                        onChange={(e) => setPatientName(e.target.value)}
                                        placeholder="Enter patient name"
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label fw-bold">
                                        Mobile No
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={mobileNo}
                                        onChange={(e) => {
                                            // Remove all non-digit characters and limit to 10 digits
                                            const value = e.target.value.replace(/\D/g, '');
                                            if (value.length <= 10) {
                                                setMobileNo(value);
                                            }
                                        }}
                                        placeholder="Enter mobile number"
                                        maxLength="10"
                                    />
                                    {/* <small className="text-muted">(Enter either Patient Name or Mobile No)</small> */}
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-12 d-flex justify-content-between">
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={handleSearch}
                                        disabled={isSearching || isPrinting || !canSearch()}
                                    >
                                        {isSearching ? (
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
                                            className="btn btn-warning"
                                            onClick={handleViewReportMain}
                                            disabled={isSearching || isPrinting || !canSearch()}
                                        >
                                            {isSearching ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Searching...
                                                </>
                                            ) : (
                                                "View Report"
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-success"
                                            onClick={handlePrintReportMain}
                                            disabled={isPrinting || !canSearch()}
                                        >
                                            {isPrinting ? (
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
                                            disabled={isSearching || isPrinting}
                                        >
                                            Reset
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {(isSearching || isGenerating) && (
                                <div className="text-center py-4">
                                    <LoadingScreen />
                                </div>
                            )}

                            {!isSearching && !isGenerating && showReport && (
                                <div className="row mt-4">
                                    <div className="col-12">
                                        <div className="card">
                                            <div className="card-header">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <h5 className="card-title mb-0">
                                                        ORDER TRACKING REPORT
                                                    </h5>
                                                </div>
                                            </div>

                                            <div className="card-body">
                                                <div className="table-responsive">
                                                    <table className="table table-bordered table-hover">
                                                        <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                                                            <tr>
                                                                <th>Order No</th>
                                                                <th>Order Date</th>
                                                                <th>Patient Name</th>
                                                                <th>Mobile No</th>
                                                                <th>Age / Gender</th>
                                                                <th>Sample ID</th>
                                                                <th>Investigation Name</th>
                                                                <th>Investigation Status</th>
                                                                <th>Report</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {reportData.length > 0 ? (
                                                                currentItems.map((row, index) => (
                                                                    <tr key={index}>
                                                                        <td>{row.orderNo}</td>
                                                                        <td>{row.orderDate}</td>
                                                                        <td>{row.patientName}</td>
                                                                        <td>{row.mobileNo}</td>
                                                                        <td>{row.ageGender}</td>
                                                                        <td>{row.sampleId}</td>
                                                                        <td>{row.investigationName}</td>
                                                                        <td>{row.investigationStatus}</td>
                                                                        <td>
                                                                            {row.report === "View / Download" ? (
                                                                                <div className="d-flex gap-1">
                                                                                    <button
                                                                                        type="button"
                                                                                        className="btn btn-primary btn-sm"
                                                                                        onClick={() => handleViewReport(row)}
                                                                                        disabled={isGeneratingPdf(row.dgOrderHdId)}
                                                                                    >
                                                                                        {isGeneratingPdf(row.dgOrderHdId) ? (
                                                                                            <>
                                                                                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                                                                                Generating...
                                                                                            </>
                                                                                        ) : (
                                                                                            "View"
                                                                                        )}
                                                                                    </button>
                                                                                </div>
                                                                            ) : (
                                                                                <span>{row.report}</span>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            ) : (
                                                                <tr>
                                                                    <td colSpan="9" className="text-center py-4">
                                                                        No Record Found
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                
                                                {/* PAGINATION USING REUSABLE COMPONENT */}
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

            {popupMessage && (
                <Popup
                    message={popupMessage.message}
                    type={popupMessage.type}
                    onClose={popupMessage.onClose}
                />
            )}
        </div>
    );
};

export default OrderTrackingReport;