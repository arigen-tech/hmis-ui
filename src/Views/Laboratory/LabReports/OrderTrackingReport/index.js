import { useState, useEffect } from "react";
import { getRequest } from "../../../../service/apiService";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../../Components/Pagination";
import Popup from "../../../../Components/popup";
import PdfViewer from "../../../../Components/PdfViewModel/PdfViewer";
import {formatDateForDisplay} from "../../../../utils/dateUtils";
import {  LAB_REPORT_URL_WRT_ORDER_HD, ORDER_TRACKING_END_URL, REQUEST_PARAM_FLAG, REQUEST_PARAM_FROM_DATE, REQUEST_PARAM_HOSPITAL_ID, REQUEST_PARAM_MOBILE_NO, REQUEST_PARAM_ORDER_HD_ID, REQUEST_PARAM_PAGE, REQUEST_PARAM_PATIENT_NAME, REQUEST_PARAM_SIZE, REQUEST_PARAM_TO_DATE, STATUS_D } from "../../../../config/apiConfig";
import { 
    INVALID_DATE_PICK_WARN_MSG, 
    SELECT_DATE_WARN_MSG, 
    LAB_REPORT_GENERATION_ERR_MSG, 
    INVALID_ORDER_ID_ERR_MSG, 
    FUTURE_DATE_PICK_WARN_MSG, 
    PAST_DATE_PICK_WARN_MSG, 
    SELECT_FROM_DATE_FIRST_WARN_MSG, 
    FETCH_ORDER_TRACKING_ERR_MSG, 
    HOSPITAL_ID_NOT_FOUND
} from "../../../../config/constants";

const OrderTrackingReport = () => {
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [patientName, setPatientName] = useState("");
    const [mobileNo, setMobileNo] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [popupMessage, setPopupMessage] = useState(null);
    const [reportData, setReportData] = useState([]);
    const [totalElements, setTotalElements] = useState(0);

    // PDF viewing states
    const [pdfUrl, setPdfUrl] = useState(null);
    const [selectedRecord, setSelectedRecord] = useState(null);
    
    // Track loading states for individual reports
    const [generatingPdfIds, setGeneratingPdfIds] = useState(new Set());

    // Get hospitalId from sessionStorage
    const getHospitalId = () => {
        try {
            return sessionStorage.getItem('hospitalId');
        } catch (error) {
            console.error("Error getting hospitalId from sessionStorage:", error);
            return null;
        }
    };

    // Get today's date in YYYY-MM-DD format
    const getTodayDate = () => new Date().toISOString().split('T')[0];

    // Check if search buttons should be enabled
    const isSearchButtonEnabled = () => {
        const hasBasicSearchField = patientName || mobileNo;
        if (fromDate || toDate) {
            return fromDate && toDate;
        }
        return hasBasicSearchField;
    };

    // Show popup
    const showPopup = (message, type = "info") => {
        setPopupMessage({
            message,
            type,
            onClose: () => setPopupMessage(null),
        });
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

        // Validate 7-day limit only if both dates are selected
        if (fromDate && selectedDate) {
            const fromDateObj = new Date(fromDate);
            const toDateObj = new Date(selectedDate);
            const diffTime = Math.abs(toDateObj - fromDateObj);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 7) {
                showPopup("Date range cannot exceed 7 days", "error");
                return;
            }
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

    // Check if a record is generating PDF
    const isGeneratingPdf = (dgOrderHdId) => generatingPdfIds.has(dgOrderHdId);

    // Generate lab report for viewing/downloading
    const generateLabReport = async (record) => {
        const dgOrderHdId = record.dgOrderHdId;

        if (!dgOrderHdId) {
            showPopup(`${INVALID_ORDER_ID_ERR_MSG} for generating report`, "error");
            return;
        }

        setGeneratingPdfIds(prev => new Set(prev).add(dgOrderHdId));
        setPdfUrl(null);
        setSelectedRecord(record);

        try {
            const url = `${LAB_REPORT_URL_WRT_ORDER_HD}?${REQUEST_PARAM_ORDER_HD_ID}=${dgOrderHdId}&${REQUEST_PARAM_FLAG}=${STATUS_D}`;
            const response = await fetch(url, {
                method: "GET",
                headers: { Accept: "application/pdf" },
            });

            if (!response.ok) throw new Error("Failed to generate PDF");

            const blob = await response.blob();
            const fileURL = window.URL.createObjectURL(blob);
            setPdfUrl(fileURL);
        } catch (error) {
            console.error("Error generating PDF", error);
            showPopup(LAB_REPORT_GENERATION_ERR_MSG, "error");
        } finally {
            setGeneratingPdfIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(dgOrderHdId);
                return newSet;
            });
        }
    };

    // View report handler for individual records
    const handleViewReport = (record) => generateLabReport(record);

    // Fetch order tracking report with pagination
    const fetchOrderTrackingReport = async (page = 1, isSearchAction = false) => {
        try {
            if (isSearchAction) {
                setIsSearching(true);
            }
            
            const hospitalId = getHospitalId();
            if (!hospitalId) {
                showPopup(HOSPITAL_ID_NOT_FOUND, "error");
                return;
            }
            
            const params = new URLSearchParams();
            params.append([REQUEST_PARAM_HOSPITAL_ID], hospitalId);
            if (patientName.trim()) params.append([REQUEST_PARAM_PATIENT_NAME], patientName.trim());
            if (mobileNo.trim()) params.append([REQUEST_PARAM_MOBILE_NO], mobileNo.trim());
            if (fromDate && toDate) {
                params.append([REQUEST_PARAM_FROM_DATE], fromDate);
                params.append([REQUEST_PARAM_TO_DATE], toDate);
            }
            params.append([REQUEST_PARAM_PAGE], page - 1);
            params.append([REQUEST_PARAM_SIZE], DEFAULT_ITEMS_PER_PAGE);

            const response = await getRequest(`${ORDER_TRACKING_END_URL}?${params.toString()}`);
            
            if (response?.response) {
                const pageData = response.response;
                const content = pageData.content || [];
                const total = pageData.totalElements || 0;
                
                const mappedData = content.map(item => ({
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
                setTotalElements(total);
                setShowReport(true);
            } else {
                setReportData([]);
                setTotalElements(0);
                setShowReport(true);
            }
        } catch (error) {
            console.error("Error fetching order tracking report:", error);
            showPopup(FETCH_ORDER_TRACKING_ERR_MSG, "error");
            setReportData([]);
            setTotalElements(0);
            setShowReport(true);
        } finally {
            if (isSearchAction) {
                setIsSearching(false);
            }
        }
    };

    // Handle page change
    const handlePageChange = (page) => {
        setCurrentPage(page);
        fetchOrderTrackingReport(page, false);
    };

    // Handle search
    const handleSearch = () => {
        if ((fromDate && !toDate) || (!fromDate && toDate)) {
            showPopup(SELECT_DATE_WARN_MSG, "warning");
            return;
        }

        if (fromDate && toDate) {
            if (new Date(fromDate) > new Date(toDate)) {
                showPopup(INVALID_DATE_PICK_WARN_MSG, "warning");
                return;
            }

            const fromDateObj = new Date(fromDate);
            const toDateObj = new Date(toDate);
            const diffTime = Math.abs(toDateObj - fromDateObj);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 7) {
                showPopup("Date range cannot exceed 7 days", "error");
                return;
            }
        }

        setCurrentPage(1);
        fetchOrderTrackingReport(1, true);
    };

    // Handle reset
    const handleReset = () => {
        setFromDate("");
        setToDate("");
        setPatientName("");
        setMobileNo("");
        setShowReport(false);
        setReportData([]);
        setTotalElements(0);
        setCurrentPage(1);
        setPdfUrl(null);
        setSelectedRecord(null);
    };

    // Initialize with empty dates
    useEffect(() => {
        // No default dates set
    }, []);

    return (
        <div className="content-wrapper">
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
                                    <label className="form-label fw-bold">From Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={fromDate}
                                        max={getTodayDate()}
                                        onChange={handleFromDateChange}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label fw-bold">To Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={toDate}
                                        max={getTodayDate()}
                                        onChange={handleToDateChange}
                                        onFocus={handleToDateFocus}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label fw-bold">Patient Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={patientName}
                                        onChange={(e) => setPatientName(e.target.value)}
                                        placeholder="Enter patient name"
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label fw-bold">Mobile No</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={mobileNo}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '');
                                            if (value.length <= 10) setMobileNo(value);
                                        }}
                                        placeholder="Enter mobile number"
                                        maxLength="10"
                                    />
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-12 d-flex justify-content-between">
                                    <div className="d-flex gap-2">
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            onClick={handleSearch}
                                            disabled={isSearching || !isSearchButtonEnabled()}
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

                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={handleReset}
                                            disabled={isSearching }
                                        >
                                            <i className="mdi mdi-refresh me-1"></i> Reset
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {!isSearching && showReport && (
                                <div className="row mt-4">
                                    <div className="col-12">
                                        <div className="card">
                                            <div className="card-header">
                                                <h5 className="card-title mb-0">ORDER TRACKING REPORT</h5>
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
                                                                reportData.map((row, index) => (
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
                                                
                                                {/* PAGINATION USING REUSABLE COMPONENT WITH SERVER-SIDE PAGINATION */}
                                                {totalElements > 0 && (
                                                    <Pagination
                                                        totalItems={totalElements}
                                                        itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                                                        currentPage={currentPage}
                                                        onPageChange={handlePageChange}
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