import { useState, useEffect, useRef } from "react";
import LoadingScreen from "../../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../../Components/Pagination";
import Popup from "../../../../Components/popup";
import PdfViewer from "../../../../Components/PdfViewModel/PdfViewer";
import { ALL_REPORTS, INVENTORY, SECTION_ID_FOR_DRUGS } from "../../../../config/apiConfig";
import { getRequest } from "../../../../service/apiService";

const ReceivingReport = () => {
    // State variables
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [itemName, setItemName] = useState("");
    const [selectedItem, setSelectedItem] = useState(null);
    const [reportType, setReportType] = useState("itemwise");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [popupMessage, setPopupMessage] = useState(null);
    const [generatedDate, setGeneratedDate] = useState("");
    const [reportRange, setReportRange] = useState("");
    const [pdfUrl, setPdfUrl] = useState(null);
    const [showPdfViewer, setShowPdfViewer] = useState(false);
    
    // Item Type state
    const [itemType, setItemType] = useState("");
    const itemTypeOptions = ["Drug", "Non Drug"];

    // Drug search state with debounce - Same as IndentCreation
    const [itemDropdown, setItemDropdown] = useState([]);
    const [itemSearch, setItemSearch] = useState("");
    const [itemPage, setItemPage] = useState(0);
    const [itemLastPage, setItemLastPage] = useState(true);
    const [showItemDropdown, setShowItemDropdown] = useState(false);
    const [isItemLoading, setIsItemLoading] = useState(false);
    
    // Refs for debounce and dropdown
    const debounceItemRef = useRef(null);
    const dropdownItemRef = useRef(null);

    const hospitalId = sessionStorage.getItem("hospitalId");

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

    // Fetch items from API with debounce - Same as IndentCreation
    const fetchItems = async (page, searchText = "") => {
        try {
            setIsItemLoading(true);
            // Determine section ID based on item type
            const params = new URLSearchParams();

            if (itemType === "Drug") {
                params.append("sectionId", SECTION_ID_FOR_DRUGS);
            }

            params.append("keyword", searchText);
            params.append("page", page);
            params.append("size", DEFAULT_ITEMS_PER_PAGE);

            const url = `${INVENTORY}/item/search?${params.toString()}`;
            const data = await getRequest(url);

            if (data.status === 200 && data.response?.content) {
                return {
                    list: data.response.content,
                    last: data.response.last,
                    totalPages: data.response.totalPages,
                    totalElements: data.response.totalElements
                };
            }
            return { list: [], last: true, totalPages: 0, totalElements: 0 };
        } catch (error) {
            console.error("Error fetching items:", error);
            return { list: [], last: true, totalPages: 0, totalElements: 0 };
        } finally {
            setIsItemLoading(false);
        }
    };

    // Fetch item details by ID
    const fetchItemDetails = async (itemId) => {
        try {
            const url = `${INVENTORY}/item/${itemId}?hospitalId=${hospitalId}`;
            const response = await getRequest(url);
            
            if (response.status === 200 && response.response) {
                return response.response;
            }
            return null;
        } catch (error) {
            console.error("Error fetching item details:", error);
            showPopup("Failed to fetch item details", "error");
            return null;
        } 
    };

    // Handle item search with debounce - Same as IndentCreation
    const handleItemSearch = (value) => {
        // Check if item type is selected
        if (!itemType) {
            showPopup("Please select Item Type first", "warning");
            return;
        }

        setItemSearch(value);
        setItemName(value);
        
        // Clear selections when user types
        if (!value.trim() || (selectedItem && !value.includes(selectedItem.nomenclature))) {
            setSelectedItem(null);
        }

        // Debounce API call
        if (debounceItemRef.current) clearTimeout(debounceItemRef.current);
        debounceItemRef.current = setTimeout(async () => {
            if (!value.trim()) {
                setItemDropdown([]);
                setShowItemDropdown(false);
                return;
            }
            const result = await fetchItems(0, value);
            setItemDropdown(result.list);
            setItemLastPage(result.last);
            setItemPage(0);
            setShowItemDropdown(true);
        }, 700);
    };

    // Load first page of items for dropdown
    const loadFirstItemPage = (searchText) => {
        if (!searchText.trim() || !itemType) return;
        setItemSearch(searchText);
        fetchItems(0, searchText).then(result => {
            setItemDropdown(result.list);
            setItemLastPage(result.last);
            setItemPage(0);
            setShowItemDropdown(true);
        });
    };

    // Load more items for infinite scroll
    const loadMoreItems = async () => {
        if (itemLastPage) return;
        const nextPage = itemPage + 1;
        const result = await fetchItems(nextPage, itemSearch);
        setItemDropdown(prev => [...prev, ...result.list]);
        setItemLastPage(result.last);
        setItemPage(nextPage);
    };

    // Handle item selection from dropdown
    const handleItemSelect = async (item) => {
        // Fetch complete item details
        const itemDetails = await fetchItemDetails(item.itemId);
        
        if (itemDetails) {
            setItemName(itemDetails.nomenclature || "");
            setSelectedItem(itemDetails);
            setItemSearch(""); // Clear the search after selection
            setShowItemDropdown(false); // Hide dropdown
        }
    };

    // Handle click outside dropdown
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownItemRef.current && !dropdownItemRef.current.contains(e.target)) {
                setShowItemDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Handle from date change with validation
    const handleFromDateChange = (e) => {
        const selectedDate = e.target.value;
        const today = getTodayDate();

        if (selectedDate > today) {
            showPopup("From date cannot be in the future", "error");
            return;
        }

        setFromDate(selectedDate);

        // Reset To Date if it's now invalid
        if (toDate && selectedDate > toDate) {
            setToDate("");
        }
    };

    // Handle to date change with validation
    const handleToDateChange = (e) => {
        const selectedDate = e.target.value;
        const today = getTodayDate();

        if (selectedDate > today) {
            showPopup("To date cannot be in the future", "error");
            return;
        }

        if (fromDate && selectedDate < fromDate) {
            showPopup("To date cannot be earlier than From date", "error");
            return;
        }

        setToDate(selectedDate);
    };

    // Clear search filter
    const clearItemSearch = () => {
        setItemName("");
        setSelectedItem(null);
        setItemSearch("");
        setItemDropdown([]);
        setShowItemDropdown(false);
    };

    // Check if all mandatory fields are filled
    const areMandatoryFieldsFilled = () => {
        // Check item type
        if (!itemType) {
            return false;
        }

        // For item-wise report, check item selection
        if (reportType === "itemwise" && !selectedItem) {
            return false;
        }

        // Date validation - if either date is selected, both must be selected
        if (fromDate || toDate) {
            if (!fromDate || !toDate) {
                return false;
            }
            
            // Validate dates are not in the future
            const today = getTodayDate();
            if (fromDate > today || toDate > today) {
                return false;
            }
            
            // Validate fromDate is not later than toDate
            if (fromDate > toDate) {
                return false;
            }
        }

        return true;
    };

    // Validate form
    const validateForm = () => {
        // Item Type is mandatory for both report types
        if (!itemType) {
            showPopup("Please select Item Type", "error");
            return false;
        }

        // For item-wise report, item selection is mandatory
        if (reportType === "itemwise" && !selectedItem) {
            showPopup("Please select an item for item-wise report", "error");
            return false;
        }

        // Date validation - if either date is selected, both must be selected
        if (fromDate || toDate) {
            if (!fromDate || !toDate) {
                showPopup("Please select both From Date and To Date or leave both empty", "error");
                return false;
            }

            if (fromDate > toDate) {
                showPopup("From Date cannot be later than To Date", "error");
                return false;
            }

            const today = getTodayDate();
            if (fromDate > today || toDate > today) {
                showPopup("Dates cannot be in the future", "error");
                return false;
            }
        }

        return true;
    };

    // Generate report - View/Download
    const generateReport = async (flag = "D") => {
        if (!validateForm()) {
            return;
        }

        if (flag === "D") {
            setIsGenerating(true);
        } else {
            setIsPrinting(true);
        }
        
        setPdfUrl(null);
        setShowPdfViewer(false);

        try {
            let url = "";
            let params = {
                hospitalId: hospitalId,
                departmentId: sessionStorage.getItem("departmentId")
            };

            // Add date parameters if both are selected
            if (fromDate && toDate) {
                params.fromDate = formatDateForAPI(fromDate);
                params.toDate = formatDateForAPI(toDate);
            }

            if (reportType === "itemwise") {
                if (!selectedItem || !selectedItem.itemId) {
                    showPopup("Please select a valid item", "error");
                    setIsGenerating(false);
                    setIsPrinting(false);
                    return;
                }
                url = `${ALL_REPORTS}/itemWiseReceiving`;
                params.itemId = selectedItem.itemId;
                params.flag = flag;
            } else {
                params.indentType = itemType.charAt(0).toUpperCase();
                params.flag = flag;
                url = `${ALL_REPORTS}/dateWiseReceiving`;
            }

            // Construct query string
            const queryString = Object.keys(params)
                .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
                .join('&');

            const fullUrl = `${url}?${queryString}`;
            console.log("API URL:", fullUrl);

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
                } else {
                    const errorText = await response.text();
                    showPopup(`Failed to generate report: ${errorText}`, "error");
                }
                setIsGenerating(false);
            } else if (flag === "P") {
                if (response.ok) {
                    // Handle print response if needed
                } else {
                    const errorText = await response.text();
                    showPopup(`Failed to print report: ${errorText}`, "error");
                }
                setIsPrinting(false);
            }

        } catch (error) {
            console.error("Error generating report:", error);
            showPopup("Failed to generate report. Please try again.", "error");
            setIsGenerating(false);
            setIsPrinting(false);
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
        setItemSearch("");
        setItemDropdown([]);
        setShowItemDropdown(false);
        setShowReport(false);
        setPdfUrl(null);
        setShowPdfViewer(false);
        setCurrentPage(1);
        setItemType("");
        setFromDate("");
        setToDate("");
    };

    // Close PDF viewer
    const handleClosePdf = () => {
        setShowPdfViewer(false);
        setPdfUrl(null);
        if (pdfUrl) {
            window.URL.revokeObjectURL(pdfUrl);
        }
    };

    // Initialize dates
    useEffect(() => {
        const today = getTodayDate();
        const defaultFromDate = new Date();
        defaultFromDate.setDate(defaultFromDate.getDate() - 30);
        
        // Set default dates only for date-wise report initially
        // For item-wise, keep them empty
        if (reportType === "datewise") {
            setFromDate(formatDateForInput(defaultFromDate.toISOString()));
            setToDate(today);
        } else {
            setFromDate("");
            setToDate("");
        }
        
        // Cleanup timeout
        return () => {
            if (debounceItemRef.current) {
                clearTimeout(debounceItemRef.current);
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
            setItemSearch("");
            setItemDropdown([]);
            setShowItemDropdown(false);
            
            // Set default dates for date-wise report
            const today = getTodayDate();
            const defaultFromDate = new Date();
            defaultFromDate.setDate(defaultFromDate.getDate() - 30);
            setFromDate(formatDateForInput(defaultFromDate.toISOString()));
            setToDate(today);
        } else {
            // Clear dates for item-wise report
            setFromDate("");
            setToDate("");
        }
    }, [reportType]);

    // Clean up blob URL on component unmount
    useEffect(() => {
        return () => {
            if (pdfUrl) {
                window.URL.revokeObjectURL(pdfUrl);
            }
        };
    }, [pdfUrl]);

    // Clear item dropdown when item type changes
    useEffect(() => {
        setItemName("");
        setSelectedItem(null);
        setItemSearch("");
        setItemDropdown([]);
        setShowItemDropdown(false);
    }, [itemType]);

    // Calculate pagination
    const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
    const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;

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

                                {/* Item Type - Mandatory for both report types */}
                                <div className="col-md-3">
                                    <label className="form-label fw-bold">
                                        Item Type <span className="text-danger">*</span>
                                    </label>
                                    <select
                                        className="form-control"
                                        value={itemType}
                                        onChange={(e) => setItemType(e.target.value)}
                                        required
                                    >
                                        <option value="">Select Item Type</option>
                                        {itemTypeOptions.map((type) => (
                                            <option key={type} value={type}>
                                                {type}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Item Name (Autocomplete) - Only for item-wise */}
                                {reportType === "itemwise" && (
                                    <div className="col-md-5 position-relative" ref={dropdownItemRef}>
                                        <label className="form-label fw-bold">
                                            Item Name <span className="text-danger">*</span>
                                        </label>
                                        <div className="input-group">
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder={itemType ? "Type item name or code..." : "Select Item Type first"}
                                                value={itemName}
                                                onChange={(e) => handleItemSearch(e.target.value)}
                                                onClick={() => {
                                                    if (itemName?.trim() && itemType) {
                                                        loadFirstItemPage(itemName);
                                                    } else if (!itemType) {
                                                        showPopup("Please select Item Type first", "warning");
                                                    }
                                                }}
                                                autoComplete="off"
                                                required
                                                disabled={!itemType}
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
                                        </div>
                                        
                                        {/* Search Dropdown - Same as IndentCreation */}
                                        {showItemDropdown && itemType && (
                                            <div 
                                                className="border rounded mt-1 bg-white position-absolute w-100"
                                                style={{ maxHeight: "250px", zIndex: 1000, overflowY: "auto" }}
                                                onScroll={(e) => {
                                                    const target = e.target;
                                                    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 50) {
                                                        loadMoreItems();
                                                    }
                                                }}
                                            >
                                                {isItemLoading && itemDropdown.length === 0 ? (
                                                    <div className="text-center p-3">
                                                        <div className="spinner-border spinner-border-sm text-primary" role="status">
                                                            <span className="visually-hidden">Loading...</span>
                                                        </div>
                                                    </div>
                                                ) : itemDropdown.length > 0 ? (
                                                    <>
                                                        {itemDropdown.map((item) => (
                                                            <div
                                                                key={item.itemId}
                                                                className="p-2 cursor-pointer hover-bg-light"
                                                                onMouseDown={(e) => {
                                                                    e.preventDefault();
                                                                    handleItemSelect(item);
                                                                }}
                                                                style={{ 
                                                                    cursor: 'pointer',
                                                                    borderBottom: '1px solid #f0f0f0'
                                                                }}
                                                            >
                                                                <div className="fw-bold">{item.nomenclature}</div>
                                                                <div className="d-flex justify-content-between align-items-center">
                                                                    <small className="text-muted">PVMS: {item.pvmsNo}</small>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        
                                                        {!itemLastPage && (
                                                            <div className="text-center p-2 text-primary small">
                                                                {isItemLoading ? 'Loading...' : 'Scroll to load more...'}
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="p-2 text-muted text-center">No items found</div>
                                                )}
                                            </div>
                                        )}
                                        
                                        {/* Selected Item Tooltip - Floating info that doesn't affect layout */}
                                        {selectedItem && (
                                            <div 
                                                style={{
                                                    position: "absolute",
                                                    bottom: "-28px",
                                                    left: 0,
                                                    right: 0,
                                                    fontSize: "11px",
                                                    color: "#6c757d",
                                                    backgroundColor: "transparent",
                                                    padding: "2px 0",
                                                    pointerEvents: "none",
                                                    zIndex: 1
                                                }}
                                            >
                                                <i className="fa fa-check-circle text-success me-1" style={{ fontSize: "10px" }}></i>
                                                <span>PVMS :{selectedItem.pvmsNo} | TYPE :{selectedItem.sectionName}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Date Range - Always shown, optional for item-wise */}
                                <div className={reportType === "itemwise" ? "col-md-2" : "col-md-3"}>
                                    <label className="form-label fw-bold">
                                        From Date {reportType === "datewise" && <span className="text-danger">*</span>}
                                    </label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={fromDate}
                                        max={getTodayDate()}
                                        onChange={handleFromDateChange}
                                        required={reportType === "datewise"}
                                    />
                                </div>

                                <div className={reportType === "itemwise" ? "col-md-2" : "col-md-3"}>
                                    <label className="form-label fw-bold">
                                        To Date {reportType === "datewise" && <span className="text-danger">*</span>}
                                    </label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={toDate}
                                        max={getTodayDate()}
                                        onChange={handleToDateChange}
                                        required={reportType === "datewise"}
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
                                            disabled={!areMandatoryFieldsFilled() || isGenerating || isPrinting}
                                        >
                                            {isGenerating ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Generating...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fa fa-eye me-2"></i>
                                                    VIEW / DOWNLOAD
                                                </>
                                            )}
                                        </button>

                                        <button
                                            type="button"
                                            className="btn btn-warning"
                                            onClick={handlePrintReport}
                                            disabled={!areMandatoryFieldsFilled() || isGenerating || isPrinting}
                                        >
                                            {isPrinting ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Printing...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fa fa-print me-2"></i>
                                                    PRINT
                                                </>
                                            )}
                                        </button>

                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={handleReset}
                                            disabled={isGenerating || isPrinting}
                                        >
                                            Reset
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Remove the LoadingScreen and just keep the text if needed */}
                            {isGenerating && (
                                <div className="text-center py-4">
                                    <p className="mt-2 text-success">Generating report, please wait...</p>
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
                    name={`${reportType === "itemwise" ? "Item-wise" : "Date-wise"} Receiving Report`}
                />
            )}
        </div>
    );
};

export default ReceivingReport;