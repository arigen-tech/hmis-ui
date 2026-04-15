import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import PdfViewer from "../../../Components/PdfViewModel/PdfViewer";
import { getRequest } from "../../../service/apiService";
import { 
    REQUEST_PARAM_HOSPITAL_ID, 
    REQUEST_PARAM_FROM_DATE, 
    REQUEST_PARAM_TO_DATE, 
    REQUEST_PARAM_FLAG,
    CASHIER_WISE_COLLECTION_END_URL,
    STATUS_D,
    STATUS_P
} from "../../../config/apiConfig";
import { 
    REPORT_GENERATION_ERR_MSG,
    SELECT_DATE_WARN_MSG,
    PAST_DATE_PICK_WARN_MSG,
    FROM_DATE_FUTURE_ERR_MSG,
    TO_DATE_FUTURE_ERR_MSG
} from "../../../config/constants";

// API endpoint - Add this to your apiConfig.js
// export const CASHIER_WISE_COLLECTION_END_URL = "/api/reports/cashierWiseCollection";

const CashierWiseCollectionReport = () => {
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [selectedCashier, setSelectedCashier] = useState(null);
    const [isViewLoading, setIsViewLoading] = useState(false);
    const [isPrintLoading, setIsPrintLoading] = useState(false);
    const [popupMessage, setPopupMessage] = useState(null);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [cashierOptions, setCashierOptions] = useState([]);

    const hospitalId = sessionStorage.getItem("hospitalId");

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

    // Fetch cashiers from your API - You need to implement this endpoint
    const fetchCashiers = async () => {
        try {
            // TODO: Replace with your actual cashier list API endpoint
            // Example: const response = await getRequest(`${GET_ALL_CASHIERS_END_URL}?hospitalId=${hospitalId}`);
            // if (response?.response) {
            //     setCashierOptions(response.response);
            // }
            
            // If you don't have a cashier list API yet, you can keep the dropdown optional
            // and just use the cashierId parameter as optional (which your backend already supports)
            console.log("Fetch cashiers - implement your cashier list API here");
        } catch (error) {
            console.error("Error fetching cashiers:", error);
        }
    };

    const handleCashierChange = (e) => {
        const selectedCashierId = e.target.value;
        if (!selectedCashierId) {
            setSelectedCashier(null);
            return;
        }
        const cashier = cashierOptions.find(c => c.id.toString() === selectedCashierId);
        setSelectedCashier(cashier || null);
    };

    const handleFromDateChange = (e) => {
        const selectedDate = e.target.value;
        const today = getTodayDate();
        if (selectedDate > today) {
            showPopup(FROM_DATE_FUTURE_ERR_MSG, "warning");
            setFromDate(today);
            return;
        }
        if (toDate && selectedDate > toDate) {
            showPopup(PAST_DATE_PICK_WARN_MSG, "warning");
            setFromDate(toDate);
            return;
        }
        setFromDate(selectedDate);
    };

    const handleToDateChange = (e) => {
        const selectedDate = e.target.value;
        const today = getTodayDate();
        if (selectedDate > today) {
            showPopup(TO_DATE_FUTURE_ERR_MSG, "warning");
            setToDate(today);
            return;
        }
        if (fromDate && selectedDate < fromDate) {
            showPopup(PAST_DATE_PICK_WARN_MSG, "warning");
            setToDate(fromDate);
            return;
        }
        setToDate(selectedDate);
    };

    const validateDates = () => {
        if (!fromDate || !toDate) {
            showPopup(SELECT_DATE_WARN_MSG, "warning");
            return false;
        }
        if (fromDate > toDate) {
            showPopup(PAST_DATE_PICK_WARN_MSG, "warning");
            return false;
        }
        return true;
    };

    // Fetch PDF from backend API
    const fetchPdf = async (flag) => {
        const baseUrl = CASHIER_WISE_COLLECTION_END_URL;
        const params = new URLSearchParams({
            [REQUEST_PARAM_HOSPITAL_ID]: hospitalId,
            [REQUEST_PARAM_FROM_DATE]: fromDate,
            [REQUEST_PARAM_TO_DATE]: toDate,
            [REQUEST_PARAM_FLAG]: flag
        });

        // Add cashierId only if selected (backend handles null/0L)
        if (selectedCashier?.id) {
            params.append("cashierId", selectedCashier.id);
        }

        const reportUrl = `${baseUrl}?${params.toString()}`;

        const response = await fetch(reportUrl, {
            method: "GET",
            headers: {
                Accept: "application/pdf",
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Failed to fetch report");
        }

        return await response.blob();
    };

    const handleViewReport = async () => {
        if (!validateDates()) return;

        try {
            setIsViewLoading(true);
            const blob = await fetchPdf(STATUS_D);
            const fileURL = window.URL.createObjectURL(blob);
            setPdfUrl(fileURL);
        } catch (err) {
            console.error("Error generating PDF:", err);
            showPopup(`${REPORT_GENERATION_ERR_MSG}: ${err.message}`, "error");
        } finally {
            setIsViewLoading(false);
        }
    };

    const handlePrintReport = async () => {
        if (!validateDates()) return;

        try {
            setIsPrintLoading(true);
            await fetchPdf(STATUS_P);
            // Backend handles printing when flag="p"
            showPopup("Print job sent successfully to the printer", "success");
        } catch (err) {
            console.error("Error printing PDF:", err);
            showPopup("Unable to print report. Please try again.", "error");
        } finally {
            setIsPrintLoading(false);
        }
    };

    const handleReset = () => {
        setFromDate(getDefaultFromDate());
        setToDate(getTodayDate());
        setSelectedCashier(null);
    };

    useEffect(() => {
        setFromDate(getDefaultFromDate());
        setToDate(getTodayDate());
        fetchCashiers();
    }, []);

    return (
        <div className="content-wrapper">
            {popupMessage && (
                <Popup
                    message={popupMessage.message}
                    type={popupMessage.type}
                    onClose={popupMessage.onClose}
                />
            )}

            {pdfUrl && (
                <PdfViewer
                    pdfUrl={pdfUrl}
                    onClose={() => {
                        window.URL.revokeObjectURL(pdfUrl);
                        setPdfUrl(null);
                    }}
                    name={`Cashier Wise Collection Report`}
                />
            )}

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
                                        Cashier (Optional)
                                    </label>
                                    <select
                                        className="form-select"
                                        value={selectedCashier?.id || ""}
                                        onChange={handleCashierChange}
                                    >
                                        <option value="">All Cashiers</option>
                                        {cashierOptions.map((cashier) => (
                                            <option key={cashier.id} value={cashier.id}>
                                                {cashier.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-md-3">
                                    {/* Empty div for alignment */}
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-12 d-flex justify-content-end gap-2">
                                    <button
                                        className="btn btn-success btn-sm"
                                        onClick={handleViewReport}
                                        disabled={isViewLoading || isPrintLoading}
                                    >
                                        {isViewLoading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fa fa-eye me-2"></i>
                                                VIEW/DOWNLOAD
                                            </>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-warning btn-sm"
                                        onClick={handlePrintReport}
                                        disabled={isViewLoading || isPrintLoading}
                                    >
                                        {isPrintLoading ? (
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
                                        className="btn btn-secondary btn-sm"
                                        onClick={handleReset}
                                        disabled={isViewLoading || isPrintLoading}
                                    >
                                        RESET
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CashierWiseCollectionReport;