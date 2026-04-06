import { useState, useEffect } from "react";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading"

const CashierWiseCollectionReport = () => {
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [cashier, setCashier] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [popupMessage, setPopupMessage] = useState(null);
    const [reportData, setReportData] = useState([]);

    const getTodayDate = () => {
        return new Date().toISOString().split('T')[0];
    };

    const getDefaultFromDate = () => {
        const date = new Date();
        date.setDate(date.getDate() - 7);
        return date.toISOString().split('T')[0];
    };

    const showPopup = (message, type = "info") => {
        setPopupMessage({
            message,
            type,
            onClose: () => setPopupMessage(null),
        });
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

        setToDate(selectedDate);
    };

    const handleReport = () => {
        if (!fromDate || !toDate) {
            showPopup("Please select both From Date and To Date", "error");
            return;
        }

        if (new Date(fromDate) > new Date(toDate)) {
            showPopup("From Date cannot be later than To Date", "error");
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

    const handleReset = () => {
        setFromDate(getDefaultFromDate());
        setToDate(getTodayDate());
        setCashier("");
        setShowReport(false);
        setReportData([]);
        setCurrentPage(1);
    };

    const handlePrint = () => {
        if (!showReport || reportData.length === 0) {
            showPopup("No data to print. Please generate report first.", "error");
            return;
        }
        // Print functionality can be implemented here
        showPopup("Print functionality will be implemented", "info");
    };

    const generateReportData = () => {
        // Filter data based on selected cashier
        let data = [
            {
                billNo: "CSH-2025-001",
                billDate: "10-Apr-2025",
                patientName: "Ramesh Kumar",
                uhid: "UHID001",
                cashier: "Rajesh Kumar",
                amount: 500,
                discount: 50,
                netAmount: 450,
                paymentMode: "Cash"
            },
            {
                billNo: "CSH-2025-002",
                billDate: "10-Apr-2025",
                patientName: "Sunita Devi",
                uhid: "UHID002",
                cashier: "Sneha Patel",
                amount: 800,
                discount: 0,
                netAmount: 800,
                paymentMode: "Card"
            },
            {
                billNo: "CSH-2025-003",
                billDate: "11-Apr-2025",
                patientName: "Amit Singh",
                uhid: "UHID003",
                cashier: "Rajesh Kumar",
                amount: 600,
                discount: 30,
                netAmount: 570,
                paymentMode: "UPI"
            },
            {
                billNo: "CSH-2025-004",
                billDate: "12-Apr-2025",
                patientName: "Priya Patel",
                uhid: "UHID004",
                cashier: "Amit Verma",
                amount: 400,
                discount: 20,
                netAmount: 380,
                paymentMode: "Cash"
            },
            {
                billNo: "CSH-2025-005",
                billDate: "12-Apr-2025",
                patientName: "Rajesh Khanna",
                uhid: "UHID005",
                cashier: "Sneha Patel",
                amount: 750,
                discount: 75,
                netAmount: 675,
                paymentMode: "Card"
            },
            {
                billNo: "CSH-2025-006",
                billDate: "13-Apr-2025",
                patientName: "Neha Gupta",
                uhid: "UHID006",
                cashier: "Rajesh Kumar",
                amount: 1200,
                discount: 100,
                netAmount: 1100,
                paymentMode: "Cash"
            },
            {
                billNo: "CSH-2025-007",
                billDate: "13-Apr-2025",
                patientName: "Vikram Singh",
                uhid: "UHID007",
                cashier: "Amit Verma",
                amount: 950,
                discount: 50,
                netAmount: 900,
                paymentMode: "Card"
            },
        ];

        // Apply cashier filter
        if (cashier) {
            data = data.filter(item => item.cashier === cashier);
        }

        return data;
    };

    useEffect(() => {
        setFromDate(getDefaultFromDate());
        setToDate(getTodayDate());
    }, []);

    const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
    const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
    const currentItems = reportData.slice(indexOfFirst, indexOfLast);

    // Calculate totals
    const totalAmount = reportData.reduce((sum, item) => sum + item.amount, 0);
    const totalDiscount = reportData.reduce((sum, item) => sum + item.discount, 0);
    const totalNetAmount = reportData.reduce((sum, item) => sum + item.netAmount, 0);

    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header">
                            <h4 className="card-title p-2 mb-0">CASHIER-WISE COLLECTION REPORT</h4>
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
                                        Cashier
                                    </label>
                                    <select
                                        className="form-select"
                                        value={cashier}
                                        onChange={(e) => setCashier(e.target.value)}
                                    >
                                        <option value="">All</option>
                                        <option value="Rajesh Kumar">Rajesh Kumar</option>
                                        <option value="Sneha Patel">Sneha Patel</option>
                                        <option value="Amit Verma">Amit Verma</option>
                                    </select>
                                </div>

                                <div className="col-md-3">
                                    {/* Empty div for alignment */}
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-12 d-flex justify-content-end gap-2">
                                    <button
                                        className="btn btn-success"
                                        onClick={handleReport}
                                        disabled={isGenerating}
                                    >
                                        {isGenerating ? (
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
                                        className="btn btn-warning"
                                        onClick={handlePrint}
                                    >
                                        Print
                                    </button>
                                </div>
                            </div>

                            {isGenerating && (
                                <div className="text-center py-4">
                                    <LoadingScreen/>
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

export default CashierWiseCollectionReport;