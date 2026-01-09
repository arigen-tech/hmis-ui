import { useState, useEffect } from "react";
import LoadingScreen from "../../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../../Components/Pagination";
import Popup from "../../../../Components/popup";

const ReceivingReport = () => {
    // State variables
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [itemName, setItemName] = useState("");
    const [selectedItem, setSelectedItem] = useState(null);
    const [isItemDropdownVisible, setItemDropdownVisible] = useState(false);
    const [reportType, setReportType] = useState("itemwise");
    const [isGenerating, setIsGenerating] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [popupMessage, setPopupMessage] = useState(null);
    const [generatedDate, setGeneratedDate] = useState("");
    const [reportRange, setReportRange] = useState("");

    // Configuration
    const MAX_MONTHS_BACK = 12;

    // Mock data for items
    const itemOptions = [
        { id: 1, name: "Syringe 5ml", code: "SYR-5ML", uom: "Piece" },
        { id: 2, name: "Paracetamol 500mg", code: "PAR-500", uom: "Tablet" },
        { id: 3, name: "Gloves Surgical", code: "GLO-SUR", uom: "Pair" },
        { id: 4, name: "Masks N95", code: "MSK-N95", uom: "Piece" },
        { id: 5, name: "Bandage 10cm", code: "BND-10", uom: "Roll" },
        { id: 6, name: "IV Cannula 18G", code: "IVC-18", uom: "Piece" },
        { id: 7, name: "Alcohol Swab", code: "ALC-SWP", uom: "Packet" },
        { id: 8, name: "Cotton Wool", code: "COT-WOL", uom: "Gram" },
    ];

    // Mock report data
    const [reportData, setReportData] = useState([]);

    // Get today's date
    const getTodayDate = () => {
        return new Date().toISOString().split('T')[0];
    };

    // Popup function
    const showPopup = (message, type = "info") => {
        setPopupMessage({
            message,
            type,
            onClose: () => setPopupMessage(null),
        });
    };

    // Format date for display
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

    // Format date for input
    const formatDateForInput = (dateString) => {
        if (!dateString) return "";
        try {
            return dateString.split('T')[0];
        } catch (error) {
            return "";
        }
    };

    // Handle from date change with validation
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

    // Handle to date change with validation
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

    // Handle item name change
    const handleItemNameChange = (e) => {
        setItemName(e.target.value);
        setItemDropdownVisible(true);
    };

    // Handle item selection
    const handleItemSelect = (item) => {
        setItemName(item.name);
        setSelectedItem(item);
        setItemDropdownVisible(false);
    };

    // Validate form
    const validateForm = () => {
        if (!fromDate || !toDate) {
            showPopup("Please select both From Date and To Date", "error");
            return false;
        }

        if (new Date(fromDate) > new Date(toDate)) {
            showPopup("From Date cannot be later than To Date", "error");
            return false;
        }

        // For item-wise report, item name is mandatory
        if (reportType === "itemwise" && !selectedItem) {
            showPopup("Please select an item for item-wise report", "error");
            return false;
        }

        return true;
    };

    // Generate mock report data
    const generateReportData = () => {
        const mockData = [];

        // Generate sample records
        for (let i = 1; i <= 15; i++) {
            const indentDate = new Date(2025, 0, i);
            const receivedDate = new Date(2025, 0, i + 1);
            
            // For date-wise report, include different items
            const itemIndex = i % itemOptions.length;
            const item = itemOptions[itemIndex];

            mockData.push({
                indentNo: `IND-2025-00${i}`,
                receivedDate: formatDateForDisplay(receivedDate.toISOString()),
                indentDate: formatDateForDisplay(indentDate.toISOString()),
                batchNo: `BATCH${String(i).padStart(3, '0')}`,
                expiry: formatDateForDisplay(new Date(2026, 0, i).toISOString()),
                brand: `Brand ${i}`,
                manufacturer: `Manufacturer ${i}`,
                qtyReq: Math.floor(Math.random() * 100) + 50,
                issued: Math.floor(Math.random() * 100) + 40,
                received: Math.floor(Math.random() * 90) + 30,
                rejected: Math.floor(Math.random() * 10) + 1,
                reason: i % 4 === 0 ? "Emergency Stock" : "Regular Replenishment",
                // Add item name for date-wise report
                itemName: item.name,
                itemCode: item.code,
                uom: item.uom
            });
        }

        return mockData;
    };

    // Handle search
    const handleSearch = () => {
        if (!validateForm()) {
            return;
        }

        setIsGenerating(true);

        // Simulate API call
        setTimeout(() => {
            const mockData = generateReportData();
            setReportData(mockData);
            setGeneratedDate(new Date().toLocaleString());
            setReportRange(`${formatDateForDisplay(fromDate)} to ${formatDateForDisplay(toDate)}`);
            setShowReport(true);
            setIsGenerating(false);
        }, 1000);
    };

    // Handle generate report
    const handleGenerateReport = () => {
        if (!showReport) {
            showPopup("Please search first to generate report", "error");
            return;
        }

        setIsGenerating(true);
        setTimeout(() => {
            showPopup(`${reportType === "itemwise" ? "Item-wise" : "Date-wise"} Receiving Report generated successfully`, "success");
            setIsGenerating(false);
        }, 1000);
    };

    // Handle view report
    const handleViewReport = () => {
        if (!showReport) {
            showPopup("Please search first to view report", "error");
            return;
        }
        // In a real app, this would open the report in a new window or modal
        showPopup("Report would be opened in a new window", "info");
    };

    // Handle reset
    const handleReset = () => {
        setItemName("");
        setSelectedItem(null);
        setShowReport(false);
        setReportData([]);
        setCurrentPage(1);
        
        // Reset dates to default (last 30 days)
        const today = getTodayDate();
        const defaultFromDate = new Date();
        defaultFromDate.setDate(defaultFromDate.getDate() - 30);
        
        setFromDate(formatDateForInput(defaultFromDate.toISOString()));
        setToDate(today);
    };

    // Initialize dates
    useEffect(() => {
        const today = getTodayDate();
        const defaultFromDate = new Date();
        defaultFromDate.setDate(defaultFromDate.getDate() - 30);
        
        setFromDate(formatDateForInput(defaultFromDate.toISOString()));
        setToDate(today);
    }, []);

    // Reset when report type changes
    useEffect(() => {
        setCurrentPage(1);
        setShowReport(false);
        setReportData([]);
        if (reportType === "datewise") {
            setItemName("");
            setSelectedItem(null);
        }
    }, [reportType]);

    // Calculate pagination
    const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
    const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
    const currentItems = reportData.slice(indexOfFirst, indexOfLast);

    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header">
                            <h4 className="card-title p-2 mb-0">ITEM RECEIVING REPORT AGAINST INDENT</h4>
                        </div>
                        <div className="card-body">
                            <div className="row mb-4">
                                {/* Report Type Selection */}
                                <div className="col-md-12 mb-3">
                                    <div className="form-check form-check-inline">
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            name="reportType"
                                            id="itemwise"
                                            value="itemwise"
                                            checked={reportType === "itemwise"}
                                            onChange={(e) => setReportType(e.target.value)}
                                        />
                                        <label className="form-check-label fw-bold" htmlFor="itemwise">
                                            ITEM-WISE RECEIVING REPORT
                                        </label>
                                    </div>
                                    <div className="form-check form-check-inline">
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            name="reportType"
                                            id="datewise"
                                            value="datewise"
                                            checked={reportType === "datewise"}
                                            onChange={(e) => setReportType(e.target.value)}
                                        />
                                        <label className="form-check-label fw-bold" htmlFor="datewise">
                                            DATE-WISE RECEIVING REPORT
                                        </label>
                                    </div>
                                </div>

                                {/* Item Name (Autocomplete) - Only for item-wise */}
                                {reportType === "itemwise" && (
                                    <div className="col-md-4 position-relative">
                                        <label className="form-label fw-bold">
                                            Item Name <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Search Item Name"
                                            value={itemName}
                                            onChange={handleItemNameChange}
                                            onFocus={() => setItemDropdownVisible(true)}
                                            onBlur={() => setTimeout(() => setItemDropdownVisible(false), 200)}
                                            autoComplete="off"
                                            required
                                        />
                                        {isItemDropdownVisible && itemName && (
                                            <ul className="list-group position-absolute w-100 mt-1" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                                                {itemOptions
                                                    .filter((item) => item.name.toLowerCase().includes(itemName.toLowerCase()))
                                                    .map((item) => (
                                                        <li
                                                            key={item.id}
                                                            className="list-group-item list-group-item-action"
                                                            onClick={() => handleItemSelect(item)}
                                                            style={{ cursor: 'pointer' }}
                                                        >
                                                            <div>
                                                                <strong>{item.name}</strong>
                                                                <small className="text-muted ms-2">({item.code})</small>
                                                            </div>
                                                            <small className="text-muted">UOM: {item.uom}</small>
                                                        </li>
                                                    ))}
                                            </ul>
                                        )}
                                    </div>
                                )}

                                {/* Date Range */}
                                <div className="col-md-4">
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

                                <div className="col-md-4">
                                    <label className="form-label fw-bold">
                                        To Date <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={toDate}
                                        max={getTodayDate()}
                                        onChange={handleToDateChange}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="row">
                                <div className="col-12 d-flex justify-content-between gap-2">
                                    <div>
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
                                    </div>

                                    <div className="d-flex gap-2">
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
                                                        {reportType === "itemwise" ? "ITEM-WISE" : "DATE-WISE"}
                                                    </h5>
                                                   
                                                </div>
                                            </div>

                                            <div className="card-body">
                                                <div className="table-responsive">
                                                    <table className="table table-bordered table-hover">
                                                        <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                                                            <tr>
                                                                <th>Indent No</th>
                                                                <th>Received Date</th>
                                                                <th>Indent Date</th>
                                                                {reportType === "datewise" && <th>Item Name</th>}
                                                                <th>Batch No</th>
                                                                <th>Expiry</th>
                                                                <th>Brand</th>
                                                                <th>Manufacturer</th>
                                                                <th style={{ textAlign: "right" }}>Qty Req</th>
                                                                <th style={{ textAlign: "right" }}>Issued</th>
                                                                <th style={{ textAlign: "right" }}>Received</th>
                                                                <th style={{ textAlign: "right" }}>Rejected</th>
                                                                <th>Reason</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {currentItems.map((row, index) => (
                                                                <tr key={index}>
                                                                    <td>{row.indentNo}</td>
                                                                    <td>{row.receivedDate}</td>
                                                                    <td>{row.indentDate}</td>
                                                                    {reportType === "datewise" && <td>{row.itemName}</td>}
                                                                    <td>{row.batchNo}</td>
                                                                    <td>{row.expiry}</td>
                                                                    <td>{row.brand}</td>
                                                                    <td>{row.manufacturer}</td>
                                                                    <td style={{ textAlign: "right" }}>{row.qtyReq}</td>
                                                                    <td style={{ textAlign: "right" }}>{row.issued}</td>
                                                                    <td style={{ textAlign: "right" }}>{row.received}</td>
                                                                    <td style={{ textAlign: "right" }}>{row.rejected}</td>
                                                                    <td>{row.reason}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {/* PAGINATION */}
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
                                            No receiving records found for the selected criteria.
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Popup Component */}
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

export default ReceivingReport;