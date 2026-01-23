import { useState, useEffect } from "react";
import LoadingScreen from "../../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../../Components/Pagination";
import Popup from "../../../../Components/popup";
import PdfViewer from "../../../../Components/PdfViewModel/PdfViewer";
import { MAS_DRUG_MAS, ALL_REPORTS } from "../../../../config/apiConfig";
import { getRequest } from "../../../../service/apiService";

const ReturnRegister = () => {
    // State variables
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [itemName, setItemName] = useState("");
    const [selectedItem, setSelectedItem] = useState(null);
    const [itemsList, setItemsList] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [isItemDropdownVisible, setItemDropdownVisible] = useState(false);
    const [reportType, setReportType] = useState("itemwise");
    const [isGenerating, setIsGenerating] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [popupMessage, setPopupMessage] = useState(null);
    const [generatedDate, setGeneratedDate] = useState("");
    const [reportRange, setReportRange] = useState("");
    const [isLoadingItems, setIsLoadingItems] = useState(false);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [isPrinting, setIsPrinting] = useState(false);
    const [searchTimeout, setSearchTimeout] = useState(null);
    const [showPdfViewer, setShowPdfViewer] = useState(false);
    
    // Get hospital and department from session storage
    const [hospitalId, setHospitalId] = useState(null);
    const [departmentId, setDepartmentId] = useState(null);
    const [hospitalName, setHospitalName] = useState("");
    const [departmentName, setDepartmentName] = useState("");

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

    // Format date for API (YYYY-MM-DD)
    const formatDateForAPI = (dateString) => {
        if (!dateString) return "";
        try {
            const date = new Date(dateString);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (error) {
            console.error("Error formatting date:", error);
            return dateString;
        }
    };

    // Get hospital and department from session storage
    const getSessionData = () => {
        try {
            const storedHospitalId = sessionStorage.getItem("hospitalId");
            const storedDepartmentId = sessionStorage.getItem("departmentId");
            const storedHospitalName = sessionStorage.getItem("hospitalName");
            const storedDepartmentName = sessionStorage.getItem("departmentName");
            
            if (storedHospitalId && storedDepartmentId) {
                setHospitalId(parseInt(storedHospitalId));
                setDepartmentId(parseInt(storedDepartmentId));
                setHospitalName(storedHospitalName || "Hospital");
                setDepartmentName(storedDepartmentName || "Department");
                return true;
            }
            return false;
        } catch (error) {
            console.error("Error reading session storage:", error);
            return false;
        }
    };

    // Fetch all items for autocomplete
    const fetchAllItems = async () => {
        setIsLoadingItems(true);
        try {
            const response = await getRequest(`${MAS_DRUG_MAS}/getAll/1`);
            
            // Handle response structure
            if (response && response.data) {
                const responseData = response.data;
                if (responseData.success && responseData.data) {
                    setItemsList(responseData.data || []);
                } else if (Array.isArray(responseData)) {
                    setItemsList(responseData || []);
                } else if (responseData.response && Array.isArray(responseData.response)) {
                    setItemsList(responseData.response || []);
                }
            } else if (Array.isArray(response)) {
                setItemsList(response || []);
            } else if (response && response.response && Array.isArray(response.response)) {
                setItemsList(response.response || []);
            }
        } catch (error) {
            console.error("Error fetching items:", error);
            showPopup("Failed to load items list", "error");
        } finally {
            setIsLoadingItems(false);
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

    // Handle item name change with debouncing
    const handleItemNameChange = (e) => {
        const value = e.target.value;
        setItemName(value);
        
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        
        const timeout = setTimeout(() => {
            if (value.trim()) {
                const searchTerm = value.toLowerCase().trim();
                const filtered = itemsList.filter(item => {
                    const name = item.nomenclature || item.itemName || item.name || "";
                    const code = item.pvmsNo || item.itemCode || item.code || "";
                    const category = item.masItemCategoryName || item.category || "";
                    
                    return (
                        name.toLowerCase().includes(searchTerm) ||
                        code.toLowerCase().includes(searchTerm) ||
                        category.toLowerCase().includes(searchTerm)
                    );
                });
                setFilteredItems(filtered);
                setItemDropdownVisible(filtered.length > 0);
            } else {
                setFilteredItems([]);
                setItemDropdownVisible(false);
            }
        }, 300);
        
        setSearchTimeout(timeout);
    };

    // Handle item selection
    const handleItemSelect = (item) => {
        setItemName(item.nomenclature || item.itemName || item.name || "");
        setSelectedItem(item);
        setItemDropdownVisible(false);
        setFilteredItems([]);
    };

    // Clear item search
    const clearItemSearch = () => {
        setItemName("");
        setSelectedItem(null);
        setFilteredItems([]);
        setItemDropdownVisible(false);
    };

    // Validate form
    const validateForm = () => {
        if (!hospitalId || !departmentId) {
            showPopup("Hospital or department information not found in session. Please login again.", "error");
            return false;
        }

        if (!fromDate || !toDate) {
            showPopup("Please select both From Date and To Date", "error");
            return false;
        }

        if (new Date(fromDate) > new Date(toDate)) {
            showPopup("From Date cannot be later than To Date", "error");
            return false;
        }

        // For item-wise report, item selection is mandatory
        if (reportType === "itemwise" && !selectedItem) {
            showPopup("Please select an item for item-wise report", "error");
            return false;
        }

        return true;
    };

    // Generate report - View/Download
    const generateReport = async (flag = "D") => {
        if (!validateForm()) {
            return;
        }

        setIsGenerating(true);
        setPdfUrl(null);
        setShowPdfViewer(false);

        try {
            const formattedFromDate = formatDateForAPI(fromDate);
            const formattedToDate = formatDateForAPI(toDate);
            
            let url = "";
            let params = {
                hospitalId: hospitalId,
                departmentId: departmentId,
                fromDate: formattedFromDate,
                toDate: formattedToDate,
                flag: flag
            };

            if (reportType === "itemwise") {
                if (!selectedItem || !selectedItem.itemId) {
                    showPopup("Please select a valid item", "error");
                    setIsGenerating(false);
                    return;
                }
                url = `${ALL_REPORTS}/itemWiseReturn`;
                params.itemId = selectedItem.itemId;
            } else {
                url = `${ALL_REPORTS}/dateWiseReturn`;
            }

            // Construct query string
            const queryString = Object.keys(params)
                .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
                .join('&');

            const fullUrl = `${url}?${queryString}`;
            console.log("Generating report with URL:", fullUrl);

            const response = await fetch(fullUrl, {
                method: "GET",
                headers: {
                    Accept: "application/pdf",
                },
            });

            if (flag === "D") {
                if (response.ok) {
                    const blob = await response.blob();
                    const fileURL = window.URL.createObjectURL(blob);
                    setPdfUrl(fileURL);
                    setShowPdfViewer(true);
                    // showPopup("Return report generated successfully!", "success");
                } else {
                    const errorText = await response.text();
                    showPopup(`Failed to generate return report: ${errorText}`, "error");
                }
            } else if (flag === "P") {
                if (response.ok) {
                    // showPopup("Return report sent to printer successfully", "success");
                } else {
                    const errorText = await response.text();
                    showPopup(`Failed to print return report: ${errorText}`, "error");
                }
            }

        } catch (error) {
            console.error("Error generating return report:", error);
            showPopup("Failed to generate return report. Please try again.", "error");
        } finally {
            setIsGenerating(false);
        }
    };
    // Handle view report (PDF)
    const handleViewReport = () => {
        generateReport("D");
    };

    // Handle print report
    const handlePrintReport = () => {
        generateReport("P");
    };

    // Handle reset
    const handleReset = () => {
        setItemName("");
        setSelectedItem(null);
        setFilteredItems([]);
        setShowReport(false);
        setPdfUrl(null);
        setShowPdfViewer(false);
        setCurrentPage(1);
        
        // Reset dates to default (last 30 days)
        const today = getTodayDate();
        const defaultFromDate = new Date();
        defaultFromDate.setDate(defaultFromDate.getDate() - 30);
        
        setFromDate(formatDateForInput(defaultFromDate.toISOString()));
        setToDate(today);
    };

    // Close PDF viewer
    const handleClosePdf = () => {
        setShowPdfViewer(false);
        setPdfUrl(null);
        if (pdfUrl) {
            window.URL.revokeObjectURL(pdfUrl);
        }
    };

    // Initialize dates and fetch data
    useEffect(() => {
        const today = getTodayDate();
        const defaultFromDate = new Date();
        defaultFromDate.setDate(defaultFromDate.getDate() - 30);
        
        setFromDate(formatDateForInput(defaultFromDate.toISOString()));
        setToDate(today);
        
        // Get session data
        const hasSessionData = getSessionData();
        if (!hasSessionData) {
            showPopup("Unable to get hospital/department information from session.", "warning");
        }
        
        // Fetch items
        fetchAllItems();
        
        // Cleanup timeout
        return () => {
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
        };
    }, []);

    // Reset when report type changes
    useEffect(() => {
        setCurrentPage(1);
        setShowReport(false);
        setPdfUrl(null);
        setShowPdfViewer(false);
        if (reportType === "datewise") {
            setItemName("");
            setSelectedItem(null);
            setFilteredItems([]);
        }
    }, [reportType]);

    // Clean up blob URL
    useEffect(() => {
        return () => {
            if (pdfUrl) {
                window.URL.revokeObjectURL(pdfUrl);
            }
        };
    }, [pdfUrl]);

    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header">
                            <h4 className="card-title p-2 mb-0">RETURN REGISTER AGAINST INDENT</h4>
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
                                            ITEM-WISE RETURN REPORT
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
                                            DATE-WISE RETURN REPORT
                                        </label>
                                    </div>
                                </div>

                                {/* Item Name (Autocomplete) - Only for item-wise */}
                                {reportType === "itemwise" && (
                                    <div className="col-md-4 position-relative">
                                        <label className="form-label fw-bold">
                                            Item Name <span className="text-danger">*</span>
                                        </label>
                                        <div className="input-group">
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Search Item Name, PVMS No, or Category"
                                                value={itemName}
                                                onChange={handleItemNameChange}
                                                onFocus={() => {
                                                    if (itemName && filteredItems.length > 0) {
                                                        setItemDropdownVisible(true);
                                                    }
                                                }}
                                                onBlur={() => setTimeout(() => setItemDropdownVisible(false), 200)}
                                                autoComplete="off"
                                                required
                                                disabled={isLoadingItems}
                                            />
                                            {itemName && (
                                                <button
                                                    className="btn btn-outline-secondary"
                                                    type="button"
                                                    onClick={clearItemSearch}
                                                >
                                                    <i className="fa fa-times"></i>
                                                </button>
                                            )}
                                            {isLoadingItems && (
                                                <span className="input-group-text">
                                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                </span>
                                            )}
                                        </div>
                                        
                                        {isItemDropdownVisible && filteredItems.length > 0 && (
                                            <ul className="list-group position-absolute w-100 mt-1" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                                                {filteredItems.map((item) => (
                                                    <li
                                                        key={item.itemId || item.id}
                                                        className="list-group-item list-group-item-action"
                                                        onClick={() => handleItemSelect(item)}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <div>
                                                            <strong>{item.nomenclature || item.itemName || item.name || "Unnamed Item"}</strong>
                                                            <small className="text-muted ms-2">
                                                                (PVMS: {item.pvmsNo || item.itemCode || "N/A"})
                                                            </small>
                                                        </div>
                                                        <small className="text-muted">
                                                            Category: {item.masItemCategoryName || item.sectionName || "N/A"}
                                                        </small>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                        
                                        {isItemDropdownVisible && itemName && filteredItems.length === 0 && !isLoadingItems && (
                                            <div className="position-absolute w-100 mt-1 border bg-white p-2" style={{ zIndex: 1000 }}>
                                                <small className="text-muted">No items found matching "{itemName}"</small>
                                            </div>
                                        )}
                                        
                                        {/* {selectedItem && (
                                            <small className="text-success mt-1 d-block">
                                                Selected: {selectedItem.nomenclature || selectedItem.itemName || selectedItem.name}
                                            </small>
                                        )} */}
                                    </div>
                                )}

                                {/* Date Range Fields */}
                                <div className={reportType === "itemwise" ? "col-md-4" : "col-md-6"}>
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

                                <div className={reportType === "itemwise" ? "col-md-4" : "col-md-6"}>
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
                                    <div className="d-flex gap-2">
                                        <button
                                            type="button"
                                            className="btn btn-success"
                                            onClick={handleViewReport}
                                            disabled={isGenerating || isLoadingItems || !hospitalId || !departmentId}
                                        >
                                            {isGenerating ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Generating...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fa fa-eye me-2"></i>
                                                    View/Download PDF
                                                </>
                                            )}
                                        </button>

                                        <button
                                            type="button"
                                            className="btn btn-warning"
                                            onClick={handlePrintReport}
                                            disabled={isGenerating || isLoadingItems || !hospitalId || !departmentId}
                                        >
                                            <i className="fa fa-print me-2"></i>
                                            Print Report
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {isGenerating && (
                                <div className="text-center py-4">
                                    <LoadingScreen />
                                    <p className="mt-2">Generating return report...</p>
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

            {/* PDF Viewer */}
            {showPdfViewer && pdfUrl && (
                <PdfViewer
                    pdfUrl={pdfUrl}
                    onClose={handleClosePdf}
                    name={`${reportType === "itemwise" ? "Item-wise" : "Date-wise"} Return Report `}
                />
            )}
        </div>
    );
};

export default ReturnRegister;