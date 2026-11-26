import { useState, useEffect, useRef } from "react";
import Popup from "../../../Components/popup";
import { getRequest, postRequest, getImageRequest } from "../../../service/apiService";
import {
    MAS_CONSENT_TYPE,
    INPATIENT_SURGERIES_OT,
    SAVE_PATIENT_CONSENT_OT,
    PATIENT_CONSENT_OT,
} from "../../../config/apiConfig";
import { formatDateTimeForDisplay } from "../../../utils/dateUtils";

const PatientConsentForm = ({ selectedPatient }) => {
    const [showDocument, setShowDocument] = useState(false);
    const [popupMessage, setPopupMessage] = useState(null);
    const [consentTypes, setConsentTypes] = useState([]);
    const [loadingConsentTypes, setLoadingConsentTypes] = useState(false);
    const [selectedConsentTypeId, setSelectedConsentTypeId] = useState("");

    // Form submission states
    const [remarks, setRemarks] = useState("");
    const [consentDocument, setConsentDocument] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    // Surgeries list states
    const [surgeries, setSurgeries] = useState([]);
    const [selectedSurgery, setSelectedSurgery] = useState(null);

    // Uploaded Consent History states
    const [consentHistory, setConsentHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Document Preview states
    const [previewDocUrl, setPreviewDocUrl] = useState(null);
    const [previewDocType, setPreviewDocType] = useState("");
    const [previewDocName, setPreviewDocName] = useState("");
    const [loadingPreview, setLoadingPreview] = useState(false);

    const effectiveInpatientId = selectedPatient?.ipdPatientId || selectedPatient?.inpatientId;

    const showPopup = (message, type = "info", onCloseCallback = null) => {
        setPopupMessage({
            message,
            type,
            onClose: () => {
                setPopupMessage(null);
                if (onCloseCallback) onCloseCallback();
            },
        });
    };

    const fetchConsentTypes = async () => {
        setLoadingConsentTypes(true);
        try {
            const res = await getRequest(`${MAS_CONSENT_TYPE}/getAll/1`);
            if (res?.response && Array.isArray(res.response)) {
                const activeTypes = res.response.filter(
                    (item) => String(item.status || "Y").toUpperCase() === "Y"
                );
                setConsentTypes(activeTypes);
            } else {
                setConsentTypes([]);
            }
        } catch (error) {
            console.error("Error fetching consent types:", error);
            setConsentTypes([]);
        } finally {
            setLoadingConsentTypes(false);
        }
    };

    const fetchInpatientSurgeries = async (inpatientId) => {
        if (!inpatientId) {
            setSurgeries([]);
            setSelectedSurgery(null);
            return;
        }
        try {
            const res = await getRequest(`${INPATIENT_SURGERIES_OT}/${inpatientId}/surgeries`);
            if (res?.response && Array.isArray(res.response)) {
                setSurgeries(res.response);
            } else {
                setSurgeries([]);
            }
        } catch (error) {
            console.error("Error fetching surgeries for inpatient:", error);
            setSurgeries([]);
        }
    };

    const fetchConsentHistory = async (admissionId) => {
        if (!admissionId) {
            setConsentHistory([]);
            return;
        }
        setLoadingHistory(true);
        try {
            const res = await getRequest(`${PATIENT_CONSENT_OT}?admissionId=${admissionId}`);
            if (res?.response && Array.isArray(res.response)) {
                setConsentHistory(res.response);
            } else {
                setConsentHistory([]);
            }
        } catch (error) {
            console.error("Error fetching consent history:", error);
            setConsentHistory([]);
        } finally {
            setLoadingHistory(false);
        }
    };

    useEffect(() => {
        fetchConsentTypes();
    }, []);

    useEffect(() => {
        setSelectedSurgery(null);
        fetchInpatientSurgeries(effectiveInpatientId);
        fetchConsentHistory(effectiveInpatientId);
    }, [effectiveInpatientId]);

    useEffect(() => {
        return () => {
            if (previewDocUrl) {
                URL.revokeObjectURL(previewDocUrl);
            }
        };
    }, [previewDocUrl]);

    const handleCancel = () => {
        setSelectedConsentTypeId("");
        setRemarks("");
        setConsentDocument(null);
        setSelectedSurgery(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmitConsent = async () => {
        if (!effectiveInpatientId) {
            showPopup("Please select a patient / admission.", "error");
            return;
        }
        if (!selectedConsentTypeId) {
            showPopup("Please select a Consent Type.", "error");
            return;
        }
        if (!consentDocument) {
            showPopup("Please upload a Consent Document.", "error");
            return;
        }

        const formData = new FormData();
        formData.append("admissionId", effectiveInpatientId);
        formData.append("consentTypeId", selectedConsentTypeId);
        formData.append("document", consentDocument);

        if (remarks && remarks.trim()) {
            formData.append("remarks", remarks.trim());
        }

        if (selectedSurgery?.surgeryId) {
            formData.append("surgeryId", selectedSurgery.surgeryId);
            if (
                selectedSurgery.otBookingId !== undefined &&
                selectedSurgery.otBookingId !== null &&
                selectedSurgery.otBookingId !== ""
            ) {
                formData.append("otBookingId", selectedSurgery.otBookingId);
            }
        }

        setIsSubmitting(true);
        try {
            const res = await postRequest(SAVE_PATIENT_CONSENT_OT, formData, { isMultipart: true });
            if (res?.status && res.status !== 200 && res.status !== 201) {
                throw new Error(res?.message || "Failed to submit patient consent.");
            }
            showPopup("Patient consent uploaded successfully!", "success");
            handleCancel();
            fetchConsentHistory(effectiveInpatientId);
        } catch (error) {
            console.error("Error submitting patient consent:", error);
            showPopup(error?.message || "Failed to submit patient consent.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenDocument = async (item) => {
        if (!item?.documentUrl) {
            showPopup("Document URL not found.", "warning");
            return;
        }
        setLoadingPreview(true);
        const docName = item.documentName || "Consent Document";
        setPreviewDocName(docName);
        setShowDocument(true);
        try {
            const blob = await getImageRequest(item.documentUrl, {}, "blob");
            const objectUrl = URL.createObjectURL(blob);
            const ext = (docName.split(".").pop() || "").toLowerCase();
            let type = "other";
            if (blob.type?.includes("pdf") || ext === "pdf") {
                type = "pdf";
            } else if (
                blob.type?.startsWith("image/") ||
                ["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(ext)
            ) {
                type = "image";
            }

            if (previewDocUrl) {
                URL.revokeObjectURL(previewDocUrl);
            }
            setPreviewDocUrl(objectUrl);
            setPreviewDocType(type);
        } catch (error) {
            console.error("Failed to load document:", error);
            showPopup(error?.message || "Failed to load document preview.", "error");
            setShowDocument(false);
        } finally {
            setLoadingPreview(false);
        }
    };

    const handleCloseDocumentModal = () => {
        setShowDocument(false);
        if (previewDocUrl) {
            URL.revokeObjectURL(previewDocUrl);
            setPreviewDocUrl(null);
        }
        setPreviewDocType("");
        setPreviewDocName("");
    };

    return (
        <>
            <div className="">
                <div className="row mb-3">
                    <div className="col-md-6 mb-2">
                        <label className="form-label fw-bold small mb-1">
                            Consent Type <span className="text-danger">*</span>
                        </label>
                        <select
                            className="form-select"
                            value={selectedConsentTypeId}
                            onChange={(e) => setSelectedConsentTypeId(e.target.value)}
                            disabled={loadingConsentTypes || isSubmitting}
                        >
                            <option value="">
                                {loadingConsentTypes ? "Loading consent types..." : "Select Consent Type"}
                            </option>
                            {consentTypes.map((item) => (
                                <option key={item.consentTypeId} value={item.consentTypeId}>
                                    {item.consentTypeName}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="col-md-6 mb-2">
                        <label className="form-label fw-bold">Remarks</label>
                        <textarea
                            className="form-control"
                            rows="2"
                            placeholder="Enter consent remarks"
                            style={{ height: "60px" }}
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            disabled={isSubmitting}
                        ></textarea>
                    </div>
                    <div className="col-md-6 mb-2">
                        <label className="form-label fw-bold small mb-1">
                            Consent Document <span className="text-danger">*</span>
                        </label>
                        <input
                            type="file"
                            className="form-control form-control-sm"
                            ref={fileInputRef}
                            onChange={(e) => setConsentDocument(e.target.files?.[0] || null)}
                            disabled={isSubmitting}
                        />
                        <div className="d-flex justify-content-between">
                            <small>Upload signed consent form</small>
                            <small>PDF, JPG or PNG</small>
                        </div>
                    </div>

                    {/* Surgeries List - only shown if surgeries exist for the patient */}
                    {surgeries && surgeries.length > 0 && (
                        <div className="col-12 mt-2 mb-2">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <label className="form-label fw-bold text-primary mb-0">
                                    Surgeries List
                                </label>
                                {selectedSurgery && (
                                    <button
                                        type="button"
                                        className="btn btn-link btn-sm p-0 text-decoration-none"
                                        onClick={() => setSelectedSurgery(null)}
                                        disabled={isSubmitting}
                                    >
                                        Clear Selection
                                    </button>
                                )}
                            </div>
                            <div className="table-responsive">
                                <table className="table table-sm table-bordered table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th className="text-center" style={{ width: "60px" }}>Select</th>
                                            <th>Surgery Name</th>
                                            <th>Surgery Type</th>
                                            <th>Surgery Level</th>
                                            <th className="text-center">Anaesthesia Required</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {surgeries.map((surgery, idx) => {
                                            const surgeryKey =
                                                surgery.otBookingRequestDtId ?? surgery.surgeryId ?? idx;
                                            const selectedKey =
                                                selectedSurgery?.otBookingRequestDtId ??
                                                selectedSurgery?.surgeryId;
                                            const isSelected =
                                                selectedSurgery !== null &&
                                                String(selectedKey) === String(surgeryKey);

                                            return (
                                                <tr
                                                    key={surgeryKey}
                                                    className={isSelected ? "table-primary" : ""}
                                                    style={{ cursor: isSubmitting ? "default" : "pointer" }}
                                                    onClick={() => {
                                                        if (!isSubmitting) setSelectedSurgery(surgery);
                                                    }}
                                                >
                                                    <td className="text-center">
                                                        <input
                                                            type="radio"
                                                            className="form-check-input"
                                                            name="ipdPatientConsentSurgery"
                                                            checked={isSelected}
                                                            onChange={() => setSelectedSurgery(surgery)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            disabled={isSubmitting}
                                                        />
                                                    </td>
                                                    <td>{surgery.surgeryName || "-"}</td>
                                                    <td>{surgery.surgeryTypeName || "-"}</td>
                                                    <td>{surgery.surgeryLevel || "-"}</td>
                                                    <td className="text-center">
                                                        {String(surgery.anesthesiaRequired || "").toUpperCase() === "Y"
                                                            ? "Yes"
                                                            : String(surgery.anesthesiaRequired || "").toUpperCase() === "N"
                                                                ? "No"
                                                                : "-"}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mb-4">
                    <button
                        type="button"
                        className="btn btn-sm btn-secondary me-2"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={handleSubmitConsent}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" />
                                Submitting...
                            </>
                        ) : (
                            "Submit"
                        )}
                    </button>
                </div>

                <div className="">
                    <hr />
                    <h6 className="fw-bold text-primary mb-2">Uploaded Consent History</h6>
                    <div className="table-responsive">
                        <table className="table table-bordered table-hover align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th style={{ width: "60px" }}>S. No</th>
                                    <th>Consent Type</th>
                                    <th>Surgery</th>
                                    <th>Remarks</th>
                                    <th>Document</th>
                                    <th>Uploaded By</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingHistory ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-3">
                                            <span className="spinner-border spinner-border-sm me-2" />
                                            Loading consent history...
                                        </td>
                                    </tr>
                                ) : consentHistory.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center text-muted py-3">
                                            No uploaded consent history found.
                                        </td>
                                    </tr>
                                ) : (
                                    consentHistory.map((item, idx) => (
                                        <tr key={item.patientConsentId || idx}>
                                            <td>{idx + 1}</td>
                                            <td className="fw-semibold">
                                                {item.consentTypeName || item.consentTypeCode || "-"}
                                            </td>
                                            <td>{item.surgeryName || "-"}</td>
                                            <td>{item.remarks || "-"}</td>
                                            <td>
                                                {item.documentUrl ? (
                                                    <button
                                                        type="button"
                                                        className="btn btn-link btn-sm p-0 text-decoration-none text-primary"
                                                        onClick={() => handleOpenDocument(item)}
                                                        title="Click to view document"
                                                    >
                                                        <i className="icofont-file-document me-1"></i>
                                                        {item.documentName || "View Document"}
                                                    </button>
                                                ) : (
                                                    item.documentName || "-"
                                                )}
                                            </td>
                                            <td>
                                                <div>{item.uploadedBy || "-"}</div>
                                                {item.uploadedDatetime && (
                                                    <small className="text-muted">
                                                        {formatDateTimeForDisplay(item.uploadedDatetime, "")}
                                                    </small>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {showDocument && (
                                <div
                                    className="modal show d-block"
                                    tabIndex="-1"
                                    style={{ background: "rgba(0, 0, 0, 0.65)", zIndex: "9999" }}
                                >
                                    <div className="modal-dialog modal-dialog-centered modal-xl" style={{ maxWidth: "90vw" }}>
                                        <div className="modal-content" style={{ maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
                                            <div className="modal-header d-flex justify-content-between align-items-center py-2 px-3">
                                                <h5 className="modal-title fw-semibold text-truncate" style={{ maxWidth: "70%" }}>
                                                    <i className="icofont-file-document me-2 text-primary"></i>
                                                    {previewDocName || "Document Preview"}
                                                </h5>
                                                <div className="d-flex align-items-center gap-2">
                                                    {previewDocUrl && (
                                                        <a
                                                            href={previewDocUrl}
                                                            download={previewDocName || "consent_document"}
                                                            className="btn btn-sm btn-outline-primary"
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            <i className="icofont-download me-1"></i> Download
                                                        </a>
                                                    )}
                                                    <button
                                                        type="button"
                                                        className="btn-close"
                                                        onClick={handleCloseDocumentModal}
                                                    ></button>
                                                </div>
                                            </div>
                                                <div
                                                    className="modal-body p-2 d-flex justify-content-center align-items-center"
                                                    style={{
                                                        minHeight: "400px",
                                                        maxHeight: "calc(90vh - 70px)",
                                                        overflow: "auto",
                                                        background: "#f8f9fa",
                                                    }}
                                                >
                                                    {loadingPreview ? (
                                                        <div className="text-center py-5">
                                                            <div className="spinner-border text-primary mb-2" role="status" />
                                                            <div>Loading document...</div>
                                                        </div>
                                                    ) : previewDocType === "pdf" ? (
                                                        <iframe
                                                            src={previewDocUrl}
                                                            title={previewDocName}
                                                            style={{ width: "100%", height: "75vh", border: "none" }}
                                                        />
                                                    ) : previewDocType === "image" ? (
                                                        <img
                                                            src={previewDocUrl}
                                                            alt={previewDocName}
                                                            style={{ maxWidth: "100%", maxHeight: "75vh", objectFit: "contain" }}
                                                        />
                                                    ) : (
                                                        <div className="text-center py-5 text-muted">
                                                            <i className="icofont-file-alt" style={{ fontSize: "48px" }}></i>
                                                            <p className="mt-3 mb-2">Preview is not available for this file type.</p>
                                                            {previewDocUrl && (
                                                                <a
                                                                    href={previewDocUrl}
                                                                    download={previewDocName || "consent_document"}
                                                                    className="btn btn-primary btn-sm"
                                                                >
                                                                    <i className="icofont-download me-1"></i> Download File
                                                                </a>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
            )}

                                    {popupMessage && (
                                        <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
                                    )}
                                </>
                                );
};

                                export default PatientConsentForm;
