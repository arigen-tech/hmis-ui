import { useState, useEffect } from "react";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import Popup from "../../../Components/popup";
import PdfViewer from "../../../Components/PdfViewModel/PdfViewer";
import {
    REQUEST_PARAM_HOSPITAL_ID,
    REQUEST_PARAM_FROM_DATE,
    REQUEST_PARAM_TO_DATE,
    REQUEST_PARAM_FLAG,
    DAILY_CASH_COLLECTION_END_URL,
    STATUS_D,
    STATUS_P
} from "../../../config/apiConfig";
import {
    FROM_DATE_FUTURE_ERR_MSG,
    PAST_DATE_PICK_WARN_MSG,
    REPORT_GENERATION_ERR_MSG,
    SELECT_DATE_WARN_MSG,
    TO_DATE_FUTURE_ERR_MSG
} from "../../../config/constants";

const CollectionReportServiceCategory = () => {
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [isViewLoading, setIsViewLoading] = useState(false);
    const [isPrintLoading, setIsPrintLoading] = useState(false);
    const [popupMessage, setPopupMessage] = useState(null);
    const [pdfUrl, setPdfUrl] = useState(null);

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

    // Helper function to fetch PDF from API
    const fetchPdf = async (flag) => {
        const params = new URLSearchParams({
            hospitalId: hospitalId,
            fromDate: fromDate,
            toDate: toDate,
            flag: flag
        });

        const reportUrl = `${DAILY_CASH_COLLECTION_END_URL}?${params.toString()}`;

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
            // Backend handles the printing when flag = "p"
        } catch (err) {
            console.error("Error printing PDF:", err);
            showPopup("Unable to print report", "error");
        } finally {
            setIsPrintLoading(false);
        }
    };

    const handleReset = () => {
        setFromDate(getDefaultFromDate());
        setToDate(getTodayDate());
        setPdfUrl(null);
    };

    useEffect(() => {
        setFromDate(getDefaultFromDate());
        setToDate(getTodayDate());
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
                        setPdfUrl(null);
                    }}
                    name={`Daily Cash Collection Report (${fromDate} to ${toDate})`}
                />
            )}

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

export default CollectionReportServiceCategory;