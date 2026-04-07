import { useState, useEffect } from "react";
import { getRequest } from "../../../../service/apiService";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../../Components/Pagination";
import Popup from "../../../../Components/popup";
import PdfViewer from "../../../../Components/PdfViewModel/PdfViewer";
import {formatDateForDisplay} from "../../../../utils/dateUtils";
import { STATUS_D, PENDING_INVESTIGATIONS_REPORT_URL, REQUEST_PARAM_HOSPITAL_ID, REQUEST_PARAM_FROM_DATE, REQUEST_PARAM_TO_DATE, REQUEST_PARAM_FLAG, REQUEST_PARAM_SUB_CHARGE_CODE_ID, STATUS_P, MAS_SUB_CHARGE_CODE_DROPDOWN_END_URL, PENDING_INVESTIGATIONS_END_URL, REQUEST_PARAM_PAGE, REQUEST_PARAM_SIZE } from "../../../../config/apiConfig";
import { 
  FETCH_PENDING_INVESTIGATIONS_ERR_MSG, 
  FETCH_SUB_CHARGE_CODES_ERR_MSG, 
  FUTURE_DATE_PICK_WARN_MSG, 
  INVALID_DATE_PICK_WARN_MSG, 
  PAST_DATE_PICK_WARN_MSG, 
  SELECT_DATE_WARN_MSG,
  LAB_REPORT_GENERATION_ERR_MSG,
  LAB_REPORT_PRINT_ERR_MSG,
  HOSPITAL_ID_NOT_FOUND
} from "../../../../config/constants";

const PendingInvestigationsReport = () => {
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [modality, setModality] = useState("");
    const [modalityOptions, setModalityOptions] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [popupMessage, setPopupMessage] = useState(null);
    const [reportData, setReportData] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isFetchingModalities, setIsFetchingModalities] = useState(false);
    const [totalElements, setTotalElements] = useState(0);
    
    // Add PDF viewer state - SEPARATE LOADING STATES
    const [pdfUrl, setPdfUrl] = useState(null);
    const [isViewLoading, setIsViewLoading] = useState(false); // For VIEW/DOWNLOAD button
    const [isPrintLoading, setIsPrintLoading] = useState(false); // For PRINT button

    const getTodayDate = () => {
        return new Date().toISOString().split('T')[0];
    };

    // Get hospitalId from sessionStorage
    const getHospitalId = () => {
        try {
            return sessionStorage.getItem('hospitalId');
        } catch (error) {
            console.error("Error getting hospitalId from sessionStorage:", error);
            return null;
        }
    };

    // Popup function
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
        
        // Set toDate to next day if not already set
        if (!toDate) {
            const nextDay = new Date(selectedDate);
            nextDay.setDate(nextDay.getDate() + 1);
            setToDate(nextDay.toISOString().split('T')[0]);
        }
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
            showPopup(PAST_DATE_PICK_WARN_MSG, "error");
            setToDate(fromDate);
            return;
        }

        setToDate(selectedDate);
    };

    // Fetch modality dropdown options
    const fetchModalityOptions = async () => {
        try {
            setIsFetchingModalities(true);
            const response = await getRequest(`${MAS_SUB_CHARGE_CODE_DROPDOWN_END_URL}`);
            
            if (response && response.response) {
                const filteredSubCharges = response.response.filter(item => item.mainChargeId === 12);
                const options = filteredSubCharges.map(item => ({
                    value: item.subId,
                    label: `${item.subName} (${item.subCode})`
                }));
                
                setModalityOptions([
                    { value: "", label: "All" },
                    ...options
                ]);
            }
        } catch (error) {
            console.error("Error fetching modality options:", error);
            showPopup(FETCH_SUB_CHARGE_CODES_ERR_MSG, "error");
        } finally {
            setIsFetchingModalities(false);
        }
    };

    // Fetch incomplete investigations report with pagination
    const fetchIncompleteInvestigationsReport = async (page = 1, isSearchAction = false) => {
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
            params.append(REQUEST_PARAM_HOSPITAL_ID, hospitalId);
            params.append(REQUEST_PARAM_FROM_DATE, fromDate);
            params.append(REQUEST_PARAM_TO_DATE, toDate);
            params.append(REQUEST_PARAM_PAGE, page - 1);
            params.append(REQUEST_PARAM_SIZE, DEFAULT_ITEMS_PER_PAGE);
            
            if (modality) {
                params.append(REQUEST_PARAM_SUB_CHARGE_CODE_ID, modality);
            }

            const response = await getRequest(`${PENDING_INVESTIGATIONS_END_URL}?${params.toString()}`);
            
            if (response && response.response) {
                const pageData = response.response;
                const content = pageData.content || [];
                const total = pageData.totalElements || 0;
                
                // Map the API response to match your table structure
                const mappedData = content.map(item => ({
                    orderNo: item.orderNo || "",
                    orderDate: formatDateForDisplay(item.orderDate),
                    patientName: item.patientName,
                    mobileNo: item.mobileNum,
                    ageGender: `${item.age} / ${item.gender}`,
                    sampleId: item.sampleId,
                    investigationName: item.investigationName,
                    currentStatus: item.currentStatus
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
            console.error("Error fetching incomplete investigations report:", error);
            showPopup(FETCH_PENDING_INVESTIGATIONS_ERR_MSG, "error");
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
        fetchIncompleteInvestigationsReport(page, false);
    };

    // Handle search
    const handleSearch = () => {
        // Validate required fields
        if (!fromDate || !toDate) {
            showPopup(SELECT_DATE_WARN_MSG, "error");
            return;
        }

        // Validate date range
        if (new Date(fromDate) > new Date(toDate)) {
            showPopup(INVALID_DATE_PICK_WARN_MSG, "error");
            return;
        }

        setCurrentPage(1);
        fetchIncompleteInvestigationsReport(1, true);
    };

    // Handle reset
    const handleReset = () => {
        const today = getTodayDate();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        setFromDate(yesterday.toISOString().split('T')[0]);
        setToDate(today);
        setModality("");
        setShowReport(false);
        setReportData([]);
        setTotalElements(0);
        setCurrentPage(1);
    };

    // Generate PDF report for viewing/downloading
    const generatePdfReport = async (flag = STATUS_D) => {
        // Validate required fields
        if (!fromDate || !toDate) {
            showPopup(SELECT_DATE_WARN_MSG, "error");
            return;
        }

        // Validate date range
        if (new Date(fromDate) > new Date(toDate)) {
            showPopup(INVALID_DATE_PICK_WARN_MSG, "error");
            return;
        }

        const hospitalId = getHospitalId();
        if (!hospitalId) {
            showPopup(HOSPITAL_ID_NOT_FOUND, "error");
            return;
        }

        // Set loading state based on flag
        if (flag === STATUS_D) {
            setIsViewLoading(true);
        } else if (flag === STATUS_P) {
            setIsPrintLoading(true);
        }
        
        setPdfUrl(null);

        try {
            const params = new URLSearchParams();
            params.append([REQUEST_PARAM_HOSPITAL_ID], hospitalId);
            params.append([REQUEST_PARAM_FROM_DATE], fromDate);
            params.append([REQUEST_PARAM_TO_DATE], toDate);
            params.append([REQUEST_PARAM_FLAG], flag);

            if (modality) {
                params.append([REQUEST_PARAM_SUB_CHARGE_CODE_ID], modality);
            }

            const url = `${PENDING_INVESTIGATIONS_REPORT_URL}?${params.toString()}`;

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    Accept: "application/pdf",
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to generate PDF: ${response.statusText}`);
            }

            if (flag === STATUS_D) {
                // For viewing/downloading
                const blob = await response.blob();
                const fileURL = window.URL.createObjectURL(blob);
                setPdfUrl(fileURL);
            } 

        } catch (error) {
            console.error("Error generating PDF", error);
            const errorMsg = flag === STATUS_D ? LAB_REPORT_GENERATION_ERR_MSG : LAB_REPORT_PRINT_ERR_MSG;
            showPopup(errorMsg, "error");
        } finally {
            // Reset the specific loading state
            if (flag === STATUS_D) {
                setIsViewLoading(false);
            } else if (flag === STATUS_P) {
                setIsPrintLoading(false);
            }
        }
    };

    // Handle view report (opens PDF viewer)
    const handleViewReport = () => {
        generatePdfReport(STATUS_D);
    };

    // Handle print report
    const handlePrintReport = () => {
        generatePdfReport(STATUS_P);
    };

    // Initialize with default dates and fetch modalities
    useEffect(() => {
        const today = getTodayDate();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        setFromDate(yesterday.toISOString().split('T')[0]);
        setToDate(today);
        
        // Fetch modality options on component mount
        fetchModalityOptions();
    }, []);

    return (
        <div className="content-wrapper">
            {/* Add Popup Component */}
            {popupMessage && (
                <Popup
                    message={popupMessage.message}
                    type={popupMessage.type}
                    onClose={popupMessage.onClose}
                />
            )}

            {/* Add PDF Viewer Component */}
            {pdfUrl && (
                <PdfViewer
                    pdfUrl={pdfUrl}
                    onClose={() => {
                        setPdfUrl(null);
                    }}
                    name={`Pending Investigations Report - ${formatDateForDisplay(fromDate)} to ${formatDateForDisplay(toDate)}`}
                />
            )}

            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header">
                            <h4 className="card-title p-2 mb-0">PENDING INVESTIGATIONS REPORT</h4>
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
                                        required
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label fw-bold">
                                        Modality
                                    </label>
                                    <select
                                        className="form-control"
                                        value={modality}
                                        onChange={(e) => setModality(e.target.value)}
                                        disabled={isFetchingModalities}
                                    >
                                        {isFetchingModalities ? (
                                            <option>Loading modalities...</option>
                                        ) : (
                                            modalityOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </div>
                            </div>

                            <div className="row mb-4">
                                <div className="col-12 d-flex justify-content-between">
                                    <div className="d-flex gap-2">
                                        <button
                                            className="btn btn-primary"
                                            onClick={handleSearch}
                                            disabled={isSearching || !fromDate || !toDate}
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
                                            disabled={isSearching}
                                        >
                                            <i className="mdi mdi-refresh me-1"></i> Reset
                                        </button>
                                    </div>
                                    
                                    <div className="d-flex gap-2">
                                        <button
                                            type="button"
                                            className="btn btn-success btn-sm"
                                            onClick={handleViewReport}
                                            disabled={isSearching || isViewLoading || !fromDate || !toDate}
                                        >
                                            {isViewLoading ? (
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
                                            className="btn btn-warning btn-sm"
                                            onClick={handlePrintReport}
                                            disabled={isSearching || isPrintLoading || !fromDate || !toDate}
                                        >
                                            {isPrintLoading ? (
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
                            </div>

                            {!isSearching && showReport && (
                                <div className="row mt-4">
                                    <div className="col-12">
                                        <div className="card">
                                            <div className="card-header">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <h5 className="card-title mb-0">
                                                        PENDING INVESTIGATIONS REPORT
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
                                                                <th>Age / Sex</th>
                                                                <th>Sample ID</th>
                                                                <th>Investigation Name</th>
                                                                <th>Current Status</th>
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
                                                                        <td>{row.currentStatus}</td>
                                                                    </tr>
                                                                ))
                                                            ) : (
                                                                <tr>
                                                                    <td colSpan="8" className="text-center py-4">
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
        </div>
    );
};

export default PendingInvestigationsReport;