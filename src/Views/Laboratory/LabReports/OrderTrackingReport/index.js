import { useState, useEffect } from "react";
import LoadingScreen from "../../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../../Components/Pagination";
import Popup from "../../../../Components/popup";

const OrderTrackingReport = () => {
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [patientName, setPatientName] = useState("");
    const [mobileNo, setMobileNo] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [popupMessage, setPopupMessage] = useState(null);
    const [reportData, setReportData] = useState([]);

    const getTodayDate = () => {
        return new Date().toISOString().split('T')[0];
    };

    const getOneWeekAgoDate = () => {
        const today = new Date();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(today.getDate() - 7);
        return oneWeekAgo.toISOString().split('T')[0];
    };

    const showPopup = (message, type = "info") => {
        setPopupMessage({
            message,
            type,
            onClose: () => setPopupMessage(null),
        });
    };

    const formatDateForDisplay = (dateString) => {
        if (!dateString) return "";
        try {
            const date = new Date(dateString);
            const day = String(date.getDate()).padStart(2, '0');
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const month = monthNames[date.getMonth()];
            const year = date.getFullYear();
            return `${day}-${month}-${year}`;
        } catch (error) {
            return "";
        }
    };

    const handleFromDateChange = (e) => {
        const selectedDate = e.target.value;
        const today = getTodayDate();

        if (selectedDate > today) {
            showPopup("From date cannot be in the future", "error");
            setFromDate(today);
            return;
        }

        if (toDate && selectedDate > toDate) {
            showPopup("From date cannot be later than To date", "error");
            setFromDate(toDate);
            return;
        }

        setFromDate(selectedDate);
    };

    const handleToDateChange = (e) => {
        const selectedDate = e.target.value;
        const today = getTodayDate();

        if (selectedDate > today) {
            showPopup("To date cannot be in the future", "error");
            setToDate(today);
            return;
        }

        if (fromDate && selectedDate < fromDate) {
            showPopup("To date cannot be earlier than From date", "error");
            setToDate(fromDate);
            return;
        }

        const fromDateObj = new Date(fromDate);
        const toDateObj = new Date(selectedDate);
        const diffTime = Math.abs(toDateObj - fromDateObj);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 7) {
            showPopup("Date range cannot exceed 7 days", "error");
            setToDate("");
            return;
        }

        setToDate(selectedDate);
    };

    const handleToDateFocus = (e) => {
        if (!fromDate) {
            e.preventDefault();
            e.target.blur();
            showPopup("Please select From Date first", "error");
        }
    };

    const handleSearch = () => {
        if (!fromDate || !toDate) {
            showPopup("Please select both From Date and To Date", "error");
            return;
        }

        if (new Date(fromDate) > new Date(toDate)) {
            showPopup("From Date cannot be later than To Date", "error");
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

        setIsGenerating(true);

        setTimeout(() => {
            const mockData = generateReportData();
            setReportData(mockData);
            setShowReport(true);
            setIsGenerating(false);
        }, 1000);
    };

    const generateReportData = () => {
        const mockData = [];
        const investigations = ["CBC", "HbA1c", "ESR", "Creatinine", "Urea", "HBsAg"];
        const statusOptions = ["Result Validated", "Result Entered", "Processing", "Sample Validated", "Sample Rejected", "Ordered"];
        const patientNames = ["Ramesh Kumar", "Anita Sharma", "Mohd. Irfan", "Sunita Devi", "Aarav Patel"];
        const mobileNumbers = ["9876543210", "9876543211", "9876543212", "9876543213", "9876543214"];

        let orderCounter = 1023;
        let sampleCounter = 1;

        for (let i = 0; i < 6; i++) {
            const orderDate = new Date(2025, 6, 1);
            const patientIndex = i % patientNames.length;
            const statusIndex = i % statusOptions.length;
            
            mockData.push({
                orderNo: `LAB-ORD-${orderCounter}`,
                orderDate: formatDateForDisplay(orderDate.toISOString()),
                patientName: patientNames[patientIndex],
                mobileNo: mobileNumbers[patientIndex],
                ageGender: i === 0 ? "45 / M" : i === 1 ? "32 / F" : i === 2 ? "60 / M" : i === 3 ? "28 / F" : "8 / M",
                sampleId: i === 0 ? "SMP-H-001" : i === 1 ? "SMP-H-002" : i === 2 ? "SMP-B-003" : "SMP-S-004",
                investigationName: investigations[i],
                investigationStatus: statusOptions[statusIndex],
                report: statusOptions[statusIndex] === "Result Validated" ? "View / Download" : "—"
            });

            if (i === 0 || i === 1) {
                orderCounter++;
            }
            sampleCounter++;
        }

        return mockData;
    };

    const handleViewReport = () => {
        if (!showReport) {
            showPopup("Please search first to view report", "error");
            return;
        }
        showPopup("Report would be opened in a new window", "info");
    };

    const handlePrintReport = () => {
        if (!showReport) {
            showPopup("Please search first to print report", "error");
            return;
        }

        setIsGenerating(true);
        setTimeout(() => {
            showPopup("Report would be printed here", "info");
            setIsGenerating(false);
        }, 1000);
    };

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
    };

    useEffect(() => {
        const today = getTodayDate();
        const oneWeekAgo = getOneWeekAgoDate();
        
        setFromDate(oneWeekAgo);
        setToDate(today);
    }, []);

    const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
    const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
    const currentItems = reportData.slice(indexOfFirst, indexOfLast);

    return (
        <div className="content-wrapper">
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
                                        onChange={(e) => setMobileNo(e.target.value)}
                                        placeholder="Enter mobile number"
                                    />
                                </div>
                            </div>

                           

                            <div className="row">
                                <div className="col-12 d-flex justify-content-end gap-2">
                                    <div className="d-flex gap-2">
                                         <button
                                        className="btn btn-success"
                                        onClick={handleSearch}
                                        disabled={isGenerating}
                                    >
                                        {isGenerating ? (
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
                                            className="btn btn-success"
                                            onClick={handleViewReport}
                                            disabled={!showReport || isGenerating}
                                        >
                                            View Report
                                        </button>

                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            onClick={handlePrintReport}
                                            disabled={!showReport || isGenerating}
                                        >
                                            Print Report
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-warning"
                                            onClick={handleReset}
                                            disabled={isGenerating}
                                        >
                                            Reset
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {isGenerating && (
                                <div className="text-center py-4">
                                    <LoadingScreen />
                                </div>
                            )}

                            {showReport && !isGenerating && reportData.length > 0 && (
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
                                                            {currentItems.map((row, index) => (
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
                                                                                onClick={() => showPopup("Report would be viewed/downloaded", "info")}
                                                                            >
                                                                                View / Download
                                                                            </button>
                                                                        ) : (
                                                                            <span>{row.report}</span>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {reportData.length > DEFAULT_ITEMS_PER_PAGE && (
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

                            {showReport && !isGenerating && reportData.length === 0 && (
                                <div className="row mt-4">
                                    <div className="col-12">
                                        <div className="alert alert-info">
                                            No order records found for the selected criteria.
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