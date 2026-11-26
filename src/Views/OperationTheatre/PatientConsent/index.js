import { useState, useEffect, useRef } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading/index";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { getRequest, postRequest, getImageRequest } from "../../../service/apiService";
import {
    MAS_CONSENT_TYPE,
    ACTIVE_ADMISSION_LIST_OT,
    INPATIENT_SURGERIES_OT,
    PATIENT_CONSENT_OT,
    SAVE_PATIENT_CONSENT_OT,
} from "../../../config/apiConfig";
import { formatDateTimeForDisplay } from "../../../utils/dateUtils";

const PatientConsent = () => {
    const [patientConsentInfo, setPatientConsentInfo] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [showDocument, setShowDocument] = useState(false);

    // Patient list states
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [popupMessage, setPopupMessage] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);

    // Filter states
    const [patientNameFilter, setPatientNameFilter] = useState("");
    const [mobileNoFilter, setMobileNoFilter] = useState("");
    const [appliedFilters, setAppliedFilters] = useState({ patientName: "", mobileNo: "" });

    // Consent Type master dropdown states
    const [consentTypes, setConsentTypes] = useState([]);
    const [loadingConsentTypes, setLoadingConsentTypes] = useState(false);
    const [selectedConsentTypeId, setSelectedConsentTypeId] = useState("");

    // Consent Form submission states
    const [remarks, setRemarks] = useState("");
    const [consentDocument, setConsentDocument] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    // Inpatient Surgeries list states
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

    const fetchActiveAdmissions = async (
        page = 0,
        patientName = appliedFilters.patientName,
        mobileNo = appliedFilters.mobileNo
    ) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page,
                size: DEFAULT_ITEMS_PER_PAGE,
            });

            if (patientName && patientName.trim()) {
                params.append("patientName", patientName.trim());
            }

            if (mobileNo && mobileNo.trim()) {
                params.append("mobileNo", mobileNo.trim());
            }

            const res = await getRequest(`${ACTIVE_ADMISSION_LIST_OT}?${params.toString()}`);

            if (res?.response) {
                const content = Array.isArray(res.response.content)
                    ? res.response.content
                    : Array.isArray(res.response)
                        ? res.response
                        : [];

                setPatients(content);
                setTotalItems(res.response.totalElements ?? content.length);
                setTotalPages(res.response.totalPages ?? (content.length > 0 ? 1 : 0));
                setCurrentPage((res.response.pageable?.pageNumber ?? page) + 1);
            } else {
                setPatients([]);
                setTotalItems(0);
                setTotalPages(0);
            }
        } catch (error) {
            console.error("Error fetching active admission list:", error);
            showPopup(error?.message || "Failed to fetch patient list.", "error");
            setPatients([]);
            setTotalItems(0);
            setTotalPages(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConsentTypes();
        fetchActiveAdmissions(0, "", "");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handlePageChange = (page) => {
        setCurrentPage(page);
        fetchActiveAdmissions(page - 1, appliedFilters.patientName, appliedFilters.mobileNo);
    };

    const handleSearch = () => {
        const nextFilters = {
            patientName: patientNameFilter,
            mobileNo: mobileNoFilter,
        };
        setAppliedFilters(nextFilters);
        setCurrentPage(1);
        fetchActiveAdmissions(0, nextFilters.patientName, nextFilters.mobileNo);
    };

    const handleReset = () => {
        setPatientNameFilter("");
        setMobileNoFilter("");
        setAppliedFilters({ patientName: "", mobileNo: "" });
        setCurrentPage(1);
        fetchActiveAdmissions(0, "", "");
    };

    const fetchInpatientSurgeries = async (inpatientId) => {
        if (!inpatientId) {
            setSurgeries([]);
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
            console.error("Error fetching inpatient surgeries:", error);
            showPopup(error?.message || "Failed to fetch surgeries list.", "error");
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

    const handleSelectPatient = (patient) => {
        setSelectedPatient(patient);
        setSelectedConsentTypeId("");
        setRemarks("");
        setConsentDocument(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        setSelectedSurgery(null);
        setSurgeries([]);
        setConsentHistory([]);
        setPatientConsentInfo(true);
        const admissionId = patient?.inpatientId || patient?.ipdPatientId;
        fetchInpatientSurgeries(admissionId);
        fetchConsentHistory(admissionId);
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

    const handleBackToList = () => {
        setPatientConsentInfo(false);
        setSelectedPatient(null);
        setSelectedConsentTypeId("");
        setRemarks("");
        setConsentDocument(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        setSurgeries([]);
        setSelectedSurgery(null);
        setConsentHistory([]);
        handleCloseDocumentModal();
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

    const handleSubmitConsent = async () => {
        const admissionId = selectedPatient?.inpatientId || selectedPatient?.ipdPatientId;
        if (!admissionId) {
            showPopup("Admission ID is required.", "error");
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
        formData.append("admissionId", admissionId);
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
            // Reset form inputs
            setSelectedConsentTypeId("");
            setRemarks("");
            setConsentDocument(null);
            setSelectedSurgery(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            fetchConsentHistory(admissionId);
        } catch (error) {
            console.error("Error submitting patient consent:", error);
            showPopup(error?.message || "Failed to submit patient consent.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ============================================================
    // PATIENT CONSENT DETAIL VIEW
    // ============================================================
    if (patientConsentInfo && selectedPatient) {
        const ageGender = [selectedPatient.age, selectedPatient.gender].filter(Boolean).join(" / ") || "-";
        const roomBed = [selectedPatient.room, selectedPatient.bed].filter(Boolean).join(" / ") || "-";

        return (
            <>
                <div className="content-wrapper">
                    <div className="card form-card">

                        <div className="card-header">
                            <div className="d-flex align-items-center gap-1">
                                <button className="btn-back" title="Back to Patient List" onClick={handleBackToList}>
                                    <i className="icofont-arrow-left"></i>
                                </button>
                                <h4 className="card-title p-2 mb-0">Patient Consent Management</h4>
                            </div>
                        </div>

                        <div className="card-body">

                            <div className="mb-3">
                                <h6 className="fw-bold text-primary mb-2">Patient Information</h6>
                                <section className="patient-card ">
                                    <div className="patient-header">
                                        <h4>{selectedPatient.patientName || "-"}</h4>
                                        <p>
                                            UHID / Admission No:{" "}
                                            <strong>
                                                {selectedPatient.uhid || "-"} / {selectedPatient.admissionNo || "-"}
                                            </strong>
                                        </p>
                                    </div>

                                    <div className="details-grid grid-col-3">
                                        <div className="detail-item">
                                            <span className="detail-label">Mobile No.</span>
                                            <span className="detail-value">{selectedPatient.mobileNo || "-"}</span>
                                        </div>

                                        <div className="detail-item">
                                            <span className="detail-label">Age / Gender</span>
                                            <span className="detail-value">{ageGender}</span>
                                        </div>

                                        <div className="detail-item">
                                            <span className="detail-label">Ward</span>
                                            <span className="detail-value">{selectedPatient.ward || "-"}</span>
                                        </div>

                                        <div className="detail-item">
                                            <span className="detail-label">Room / Bed No.</span>
                                            <span className="detail-value">{roomBed}</span>
                                        </div>

                                        <div className="detail-item">
                                            <span className="detail-label">Doctor Name</span>
                                            <span className="detail-value">{selectedPatient.doctorName || "-"}</span>
                                        </div>

                                        <div className="detail-item">
                                            <span className="detail-label">Diagnosis</span>
                                            <span className="detail-value">{selectedPatient.diagnosis || "-"}</span>
                                        </div>

                                        <div className="detail-item">
                                            <span className="detail-label">Admission Date / Time</span>
                                            <span className="detail-value">
                                                {formatDateTimeForDisplay(selectedPatient.admissionDateTime, "-")}
                                            </span>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            <div className="row mb-3">
                                <div className="col-md-6 mb-2">
                                    <label className="form-label fw-bold small mb-1">
                                        Consent Type <span className="text-danger">*</span>
                                    </label>
                                    <select
                                        className="form-select"
                                        value={selectedConsentTypeId}
                                        onChange={(e) => setSelectedConsentTypeId(e.target.value)}
                                        disabled={loadingConsentTypes}
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
                                                                style={{ cursor: "pointer" }}
                                                                onClick={() => setSelectedSurgery(surgery)}
                                                            >
                                                                <td className="text-center">
                                                                    <input
                                                                        type="radio"
                                                                        className="form-check-input"
                                                                        name="patientConsentSurgery"
                                                                        checked={isSelected}
                                                                        onChange={() => setSelectedSurgery(surgery)}
                                                                        onClick={(e) => e.stopPropagation()}
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
                                <button type="button" className="btn btn-secondary me-2" onClick={handleBackToList} disabled={isSubmitting}>
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
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
    }

                                    // ============================================================
                                    // PATIENT LIST VIEW
                                    // ============================================================
                                    return (
                                    <>
                                        <div className="content-wrapper">
                                            {loading && <LoadingScreen />}
                                            <div className="card form-card">
                                                <div className="card-header">
                                                    <h4 className="card-title p-2 mb-0 ps-0">Patient Consent Management</h4>
                                                </div>
                                                <div className="card-body">

                                                    <div className="mb-4">
                                                        <div className="row g-3 align-items-end">
                                                            <div className="col-md-3">
                                                                <label className="form-label fw-bold">Patient Name</label>
                                                                <input
                                                                    type="text"
                                                                    className="form-control"
                                                                    placeholder="Enter patient name"
                                                                    value={patientNameFilter}
                                                                    onChange={(e) => setPatientNameFilter(e.target.value)}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === "Enter") {
                                                                            handleSearch();
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="col-md-3">
                                                                <label className="form-label fw-bold">Mobile No.</label>
                                                                <input
                                                                    type="text"
                                                                    className="form-control"
                                                                    placeholder="Enter mobile number"
                                                                    value={mobileNoFilter}
                                                                    onChange={(e) => setMobileNoFilter(e.target.value)}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === "Enter") {
                                                                            handleSearch();
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="col-md-3 d-flex gap-2">
                                                                <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
                                                                    <i className="fa fa-search me-1"></i> <span>Search</span>
                                                                </button>
                                                                <button className="btn btn-secondary" onClick={handleReset} disabled={loading}>
                                                                    <i className="fa fa-refresh me-1"></i> <span>Reset</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="table-responsive">
                                                        <table className="table table-bordered table-hover align-middle">
                                                            <thead className="table-light">
                                                                <tr>
                                                                    <th>UHID</th>
                                                                    <th>Admission No.</th>
                                                                    <th>Patient Name</th>
                                                                    <th>Age / Gender</th>
                                                                    <th>Mobile No.</th>
                                                                    <th>Doctor Name</th>
                                                                    <th>Diagnosis</th>
                                                                    <th>Ward / Room / Bed</th>
                                                                    <th>Admission Date / Time</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {patients.length > 0 ? (
                                                                    patients.map((item, idx) => {
                                                                        const ageGender = [item.age, item.gender].filter(Boolean).join(" / ") || "-";
                                                                        const wardRoomBed = [item.ward, item.room, item.bed].filter(Boolean).join(" / ") || "-";

                                                                        return (
                                                                            <tr
                                                                                key={item.inpatientId ?? item.patientId ?? idx}
                                                                                style={{ cursor: "pointer" }}
                                                                                onClick={() => handleSelectPatient(item)}
                                                                            >
                                                                                <td>{item.uhid || "-"}</td>
                                                                                <td>{item.admissionNo || "-"}</td>
                                                                                <td>{item.patientName || "-"}</td>
                                                                                <td>{ageGender}</td>
                                                                                <td>{item.mobileNo || "-"}</td>
                                                                                <td>{item.doctorName || "-"}</td>
                                                                                <td>{item.diagnosis || "-"}</td>
                                                                                <td>{wardRoomBed}</td>
                                                                                <td>{formatDateTimeForDisplay(item.admissionDateTime, "-")}</td>
                                                                            </tr>
                                                                        );
                                                                    })
                                                                ) : (
                                                                    <tr>
                                                                        <td colSpan="9" className="text-center py-4 text-muted">
                                                                            {loading ? "Loading patients..." : "No active admitted patients found."}
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>

                                                    {totalItems > 0 && (
                                                        <Pagination
                                                            totalItems={totalItems}
                                                            itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                                                            currentPage={currentPage}
                                                            onPageChange={handlePageChange}
                                                            totalPages={totalPages}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {popupMessage && (
                                            <Popup message={popupMessage.message} type={popupMessage.type} onClose={popupMessage.onClose} />
                                        )}
                                    </>
                                    );
};

                                    export default PatientConsent;
