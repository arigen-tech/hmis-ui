import { useState, useEffect } from "react";
import LoadingScreen from "../../../Components/Loading";
import Popup from "../../../Components/popup";
import PdfViewer from "../../../Components/PdfViewModel/PdfViewer";
import { getRequest } from "../../../service/apiService";
import {
    REQUEST_PARAM_HOSPITAL_ID,
    REQUEST_PARAM_FROM_DATE,
    REQUEST_PARAM_TO_DATE,
    REQUEST_PARAM_FLAG,
    STATUS_D,
    STATUS_P,
    MAS_SUB_CHARGE_CODE,
    RADIOLOGY_BILLING_REGISTER_END_URL
} from "../../../config/apiConfig";
import {
    FROM_DATE_FUTURE_ERR_MSG,
    PAST_DATE_PICK_WARN_MSG,
    REPORT_GENERATION_ERR_MSG,
    SELECT_DATE_WARN_MSG,
    TO_DATE_FUTURE_ERR_MSG,
    FETCH_SUB_CHARGE_CODES_ERR_MSG
} from "../../../config/constants";

const RadiologyBillingRegister = () => {
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [selectedSubChargeCodeId, setSelectedSubChargeCodeId] = useState(null);
    const [modalityOptions, setModalityOptions] = useState([]);
    const [isFetchingModalities, setIsFetchingModalities] = useState(false);
    
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

    // Fetch modality dropdown options from API
    const fetchModalityOptions = async () => {
        try {
            setIsFetchingModalities(true);
            const response = await getRequest(`${MAS_SUB_CHARGE_CODE}/getAll/1`);
            
            if (response && response.response) {
                // Filter for radiology modalities (mainChargeId === 11 for radiology)
                // Adjust this filter based on your actual mainChargeId for radiology
                const filteredSubCharges = response.response.filter(item => item.mainChargeId === 11);
                
                const options = filteredSubCharges.map(item => ({
                    id: item.subId,
                    name: `${item.subName} (${item.subCode})`
                }));
                
                setModalityOptions([
                    { id: "", name: "All Modalities" },
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
            [REQUEST_PARAM_HOSPITAL_ID]: hospitalId,
            [REQUEST_PARAM_FROM_DATE]: fromDate,
            [REQUEST_PARAM_TO_DATE]: toDate
        });

        // Only add subChargeCodeId if it's not empty (backend will convert null to 0L)
        if (selectedSubChargeCodeId && selectedSubChargeCodeId !== "") {
            params.append("subChargeCodeId", selectedSubChargeCodeId);
        }

        params.append(REQUEST_PARAM_FLAG, flag);

        const reportUrl = `${RADIOLOGY_BILLING_REGISTER_END_URL}?${params.toString()}`;

        const response = await fetch(reportUrl, {
            method: "GET",
            headers: {
                Accept: "application/pdf",
            },
        });

        if (!response.ok) {
            throw new Error("Failed to fetch report");
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
            // Just fetch the PDF with flag "p" - backend handles the printing
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
        setSelectedSubChargeCodeId(null);
    };

    const handleModalityChange = (e) => {
        const value = e.target.value;
        setSelectedSubChargeCodeId(value);
    };

    useEffect(() => {
        setFromDate(getDefaultFromDate());
        setToDate(getTodayDate());
        setSelectedSubChargeCodeId(null);
        fetchModalityOptions();
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
                    name={`Radiology Billing Register Report`}
                />
            )}

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
                                        className="form-select"
                                        value={selectedSubChargeCodeId || ""}
                                        onChange={handleModalityChange}
                                        disabled={isFetchingModalities}
                                    >
                                        {isFetchingModalities ? (
                                            <option>Loading modalities...</option>
                                        ) : (
                                            modalityOptions.map((modality) => (
                                                <option key={modality.id} value={modality.id}>
                                                    {modality.name}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-12 d-flex justify-content-end gap-2">
                                    <button
                                        className="btn btn-success btn-sm"
                                        onClick={handleViewReport}
                                        disabled={isViewLoading || isPrintLoading || isFetchingModalities}
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
                                        disabled={isViewLoading || isPrintLoading || isFetchingModalities}
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
                                        disabled={isViewLoading || isPrintLoading || isFetchingModalities}
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

export default RadiologyBillingRegister;