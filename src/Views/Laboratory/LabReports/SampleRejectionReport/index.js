import { useState, useEffect } from "react";
import LoadingScreen from "../../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../../Components/Pagination";
import Popup from "../../../../Components/popup";

const SampleRejectionReport = () => {
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
        if (!toDate) {
            const nextDay = new Date(selectedDate);
            nextDay.setDate(nextDay.getDate() + 1);
            setToDate(nextDay.toISOString().split('T')[0]);
        }
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

    const handleSearch = () => {
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

    const generateReportData = () => {
        return [
            {
                orderNo: "ORD-2025-00123",
                orderDate: "10-Aug-2025",
                patientName: "Ramesh Kumar",
                ageGender: "45 / M",
                mobile: "98XXXX1234",
                investigation: "CBC",
                sampleId: "SMP-56781",
                status: "Rejected",
                rejectionRemarks: "Hemolysed sample"
            },
            {
                orderNo: "ORD-2025-00124",
                orderDate: "10-Aug-2025",
                patientName: "Sunita Sharma",
                ageGender: "32 / F",
                mobile: "97XXXX4567",
                investigation: "Blood Sugar (F)",
                sampleId: "SMP-56782",
                status: "Rejected",
                rejectionRemarks: "Insufficient sample quantity"
            },
            {
                orderNo: "ORD-2025-00125",
                orderDate: "11-Aug-2025",
                patientName: "Mohan Das",
                ageGender: "60 / M",
                mobile: "99XXXX7890",
                investigation: "Serum Creatinine",
                sampleId: "SMP-56783",
                status: "Rejected",
                rejectionRemarks: "Wrong container used"
            },
            {
                orderNo: "ORD-2025-00126",
                orderDate: "11-Aug-2025",
                patientName: "Anita Verma",
                ageGender: "28 / F",
                mobile: "96XXXX3210",
                investigation: "CRP",
                sampleId: "SMP-56784",
                status: "Rejected",
                rejectionRemarks: "Clotted sample"
            },
            {
                orderNo: "ORD-2025-00127",
                orderDate: "12-Aug-2025",
                patientName: "Rajesh Singh",
                ageGender: "52 / M",
                mobile: "95XXXX6543",
                investigation: "Lipid Profile",
                sampleId: "SMP-56785",
                status: "Rejected",
                rejectionRemarks: "Sample leaked during transport"
            }, {
                orderNo: "ORD-2025-00125",
                orderDate: "11-Aug-2025",
                patientName: "Mohan Das",
                ageGender: "60 / M",
                mobile: "99XXXX7890",
                investigation: "Serum Creatinine",
                sampleId: "SMP-56783",
                status: "Rejected",
                rejectionRemarks: "Wrong container used"
            }, {
                orderNo: "ORD-2025-00125",
                orderDate: "11-Aug-2025",
                patientName: "Mohan Das",
                ageGender: "60 / M",
                mobile: "99XXXX7890",
                investigation: "Serum Creatinine",
                sampleId: "SMP-56783",
                status: "Rejected",
                rejectionRemarks: "Wrong container used"
            },
        ];
    };

    useEffect(() => {
        const today = getTodayDate();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        setFromDate(yesterday.toISOString().split('T')[0]);
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
                            <h4 className="card-title p-2 mb-0">SAMPLE REJECTION REPORT</h4>
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
                                        <option value="Hematology">Hematology</option>
                                        <option value="Biochemistry">Biochemistry</option>
                                        <option value="Microbiology">Microbiology</option>
                                        <option value="Radiology">Radiology</option>
                                    </select>
                                </div>
                            </div>
                            <div className="row">

                                <div className="col-12 d-flex justify-content-end gap-2">
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
                                    >
                                        View Report
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                    >
                                        Print Report
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-warning"
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

                        {showReport && !isGenerating && reportData.length > 0 && (
                            <div className="row mt-4">
                                <div className="col-12">
                                    <div className="card">
                                        <div className="card-header">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <h5 className="card-title mb-0">
                                                    SAMPLE REJECTION REPORT
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
                                                            <th>Age / Gender</th>
                                                            <th>Mobile</th>
                                                            <th>Investigation</th>
                                                            <th>Sample ID</th>
                                                            <th>Status</th>
                                                            <th>Rejection Remarks</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {currentItems.map((row, index) => (
                                                            <tr key={index}>
                                                                <td>{row.orderNo}</td>
                                                                <td>{row.orderDate}</td>
                                                                <td>{row.patientName}</td>
                                                                <td>{row.ageGender}</td>
                                                                <td>{row.mobile}</td>
                                                                <td>{row.investigation}</td>
                                                                <td>{row.sampleId}</td>
                                                                <td>{row.status}</td>
                                                                <td>{row.rejectionRemarks}</td>
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
                                        No sample rejection records found for the selected criteria.
                                    </div>
                                </div>
                                
                            </div>
                        )}
                        
                    </div>
                </div>
            </div>
        </div>

            {
        popupMessage && (
            <Popup
                message={popupMessage.message}
                type={popupMessage.type}
                onClose={popupMessage.onClose}
            />
        )
    }
        </div >
    );
};

export default SampleRejectionReport;