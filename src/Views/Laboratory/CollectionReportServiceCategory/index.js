import { useState, useEffect } from "react";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import Popup from "../../../Components/popup";

const CollectionReportServiceCategory = () => {
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
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
        setShowReport(false);
        setReportData([]);
        setCurrentPage(1);
    };

    const generateReportData = () => {
        return [
            {
                serviceCategory: "OPD Consultation",
                totalBills: 45,
                totalAmount: 22500,
                totalDiscount: 2250,
                totalNetAmount: 20250,
                cashAmount: 8500,
                cardAmount: 6750,
                upiAmount: 5000,
                otherAmount: 0
            },
            {
                serviceCategory: "LAB Investigations",
                totalBills: 38,
                totalAmount: 28500,
                totalDiscount: 2850,
                totalNetAmount: 25650,
                cashAmount: 10250,
                cardAmount: 8900,
                upiAmount: 6500,
                otherAmount: 0
            },
            {
                serviceCategory: "Radiology",
                totalBills: 32,
                totalAmount: 62500,
                totalDiscount: 6250,
                totalNetAmount: 56250,
                cashAmount: 18500,
                cardAmount: 22000,
                upiAmount: 15750,
                otherAmount: 0
            },
            {
                serviceCategory: "Pharmacy",
                totalBills: 52,
                totalAmount: 38500,
                totalDiscount: 3850,
                totalNetAmount: 34650,
                cashAmount: 14500,
                cardAmount: 12150,
                upiAmount: 8000,
                otherAmount: 0
            },
            {
                serviceCategory: "Physiotherapy",
                totalBills: 18,
                totalAmount: 16200,
                totalDiscount: 1620,
                totalNetAmount: 14580,
                cashAmount: 5800,
                cardAmount: 4780,
                upiAmount: 4000,
                otherAmount: 0
            },
            {
                serviceCategory: "Dental",
                totalBills: 15,
                totalAmount: 22500,
                totalDiscount: 2250,
                totalNetAmount: 20250,
                cashAmount: 8250,
                cardAmount: 7000,
                upiAmount: 5000,
                otherAmount: 0
            },
        ];
    };

    useEffect(() => {
        setFromDate(getDefaultFromDate());
        setToDate(getTodayDate());
    }, []);

    const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
    const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
    const currentItems = reportData.slice(indexOfFirst, indexOfLast);

    // Calculate grand totals
    const grandTotalBills = reportData.reduce((sum, item) => sum + item.totalBills, 0);
    const grandTotalAmount = reportData.reduce((sum, item) => sum + item.totalAmount, 0);
    const grandTotalDiscount = reportData.reduce((sum, item) => sum + item.totalDiscount, 0);
    const grandTotalNetAmount = reportData.reduce((sum, item) => sum + item.totalNetAmount, 0);
    const grandCashAmount = reportData.reduce((sum, item) => sum + item.cashAmount, 0);
    const grandCardAmount = reportData.reduce((sum, item) => sum + item.cardAmount, 0);
    const grandUpiAmount = reportData.reduce((sum, item) => sum + item.upiAmount, 0);
    const grandOtherAmount = reportData.reduce((sum, item) => sum + item.otherAmount, 0);

    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header">
                            <h4 className="card-title p-2 mb-0">COLLECTION REPORT FOR SERVICE CATEGORY</h4>
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
                                        onClick={handleReset}
                                    >
                                        Reset
                                    </button>
                                </div>
                            </div>

                            {isGenerating && (
                                <div className="text-center py-4">
                                    <LoadingScreen />
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

export default CollectionReportServiceCategory;