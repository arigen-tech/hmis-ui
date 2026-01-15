import { useState, useEffect } from "react";
import { getRequest } from "../../../../service/apiService";
import LoadingScreen from "../../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../../Components/Pagination";
import Popup from "../../../../Components/popup";
import { MAS_SUB_CHARGE_CODE } from "../../../../config/apiConfig";
import { FETCH_PENDING_INVESTIGATIONS_ERR_MSG, FETCH_SUB_CHARGE_CODES_ERR_MSG, FUTURE_DATE_PICK_WARN_MSG, INVALID_DATE_PICK_WARN_MSG, PAST_DATE_PICK_WARN_MSG, SELECT_DATE_WARN_MSG } from "../../../../config/constants";

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

     const formatDateForDisplay = (dateString) => {
        if (!dateString) return "";
        try {
            const date = new Date(dateString);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        } catch (error) {
            console.error("Error formatting date:", error);
            return "";
        }
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
            const response = await getRequest(`${MAS_SUB_CHARGE_CODE}/getAll/1`);
            
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

    // Fetch incomplete investigations report
    const fetchIncompleteInvestigationsReport = async () => {
        try {
            setIsSearching(true);
            
            const params = new URLSearchParams();
            params.append('fromDate', fromDate);
            params.append('toDate', toDate);
            
            if (modality) {
                params.append('subChargeCodeId', modality);
            }

            const response = await getRequest(`/report/incomplete-investigation-report?${params.toString()}`);
            
            if (response && response.response) {
                // Map the API response to match your table structure
                const mappedData = response.response.map(item => ({
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
                setShowReport(true);
            } else {
                setReportData([]);
                setShowReport(true);
            }
        } catch (error) {
            console.error("Error fetching incomplete investigations report:", error);
            showPopup(FETCH_PENDING_INVESTIGATIONS_ERR_MSG, "error");
            setReportData([]);
            setShowReport(true);
        } finally {
            setIsSearching(false);
        }
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

        fetchIncompleteInvestigationsReport();
        setCurrentPage(1);
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
        setCurrentPage(1);
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
                                <div className="col-12 d-flex justify-content-end gap-2">
                                    <button
                                        className="btn btn-success"
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
                                        className="btn btn-warning"
                                        onClick={handleReset}
                                        disabled={isSearching}
                                    >
                                        Reset
                                    </button>
                                </div>
                            </div>

                            {isSearching && (
                                <div className="text-center py-4">
                                    <LoadingScreen />
                                </div>
                            )}

                            {showReport && !isSearching  && (
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
                                                            {reportData.length > 0 ?(
                                                                currentItems.map((row, index) => (
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
                                                            ):(
                                                                 <tr>
                                                                    <td colSpan="8" className="text-center py-4">
                                                                        No Record Found
                                                                    </td>
                                                                </tr>
                                                            )
                                                            }
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

export default PendingInvestigationsReport;