import { useState, useEffect } from "react";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import Popup from "../../../Components/popup";

const RadiologyBillingRegister = () => {
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [modality, setModality] = useState("");
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
        setModality("");
        setShowReport(false);
        setReportData([]);
        setCurrentPage(1);
    };

    const generateReportData = () => {
        return [
            {
                billNo: "RAD-2025-001",
                billDate: "10-Apr-2025",
                patientName: "Ramesh Kumar",
                uhid: "UHID001",
                modality: "X-Ray",
                investigation: "Chest X-Ray PA View",
                amount: 350,
                discount: 35,
                netAmount: 315,
                paymentMode: "Cash"
            },
            {
                billNo: "RAD-2025-002",
                billDate: "10-Apr-2025",
                patientName: "Sunita Devi",
                uhid: "UHID002",
                modality: "Ultrasound",
                investigation: "Abdomen Ultrasound",
                amount: 1200,
                discount: 0,
                netAmount: 1200,
                paymentMode: "Card"
            },
            {
                billNo: "RAD-2025-003",
                billDate: "11-Apr-2025",
                patientName: "Amit Singh",
                uhid: "UHID003",
                modality: "CT Scan",
                investigation: "CT Head Plain",
                amount: 2500,
                discount: 250,
                netAmount: 2250,
                paymentMode: "UPI"
            },
            {
                billNo: "RAD-2025-004",
                billDate: "11-Apr-2025",
                patientName: "Priya Patel",
                uhid: "UHID004",
                modality: "MRI",
                investigation: "MRI Knee",
                amount: 3500,
                discount: 350,
                netAmount: 3150,
                paymentMode: "Cash"
            },
            {
                billNo: "RAD-2025-005",
                billDate: "12-Apr-2025",
                patientName: "Rajesh Khanna",
                uhid: "UHID005",
                modality: "X-Ray",
                investigation: "Lumbar Spine X-Ray",
                amount: 350,
                discount: 0,
                netAmount: 350,
                paymentMode: "Card"
            },
            {
                billNo: "RAD-2025-006",
                billDate: "12-Apr-2025",
                patientName: "Neha Gupta",
                uhid: "UHID006",
                modality: "Ultrasound",
                investigation: "Pelvic Ultrasound",
                amount: 1000,
                discount: 100,
                netAmount: 900,
                paymentMode: "UPI"
            },
            {
                billNo: "RAD-2025-007",
                billDate: "13-Apr-2025",
                patientName: "Vikram Singh",
                uhid: "UHID007",
                modality: "CT Scan",
                investigation: "CT Chest",
                amount: 3000,
                discount: 300,
                netAmount: 2700,
                paymentMode: "Cash"
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

    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header">
                            <h4 className="card-title p-2 mb-0">RADIOLOGY BILLING REGISTER</h4>
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
                                    >
                                        <option value="">All</option>
                                        <option value="X-Ray">X-Ray</option>
                                        <option value="Ultrasound">Ultrasound</option>
                                        <option value="CT Scan">CT Scan</option>
                                        <option value="MRI">MRI</option>
                                        <option value="Mammography">Mammography</option>
                                        <option value="DEXA Scan">DEXA Scan</option>
                                    </select>
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
                                    >
                                        Print 
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

export default RadiologyBillingRegister;