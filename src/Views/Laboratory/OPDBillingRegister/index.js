import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import PdfViewer from "../../../Components/PdfViewModel/PdfViewer";
import { getRequest } from "../../../service/apiService";
import { 
    DOCTOR_BY_SPECIALITY, 
    FILTER_OPD_DEPT, 
    GET_ALL_ACT_MAS_DEPT_FOR_DROPDOWN_END_URL, 
    REQUEST_PARAM_DEPARTMENT_ID, 
    REQUEST_PARAM_DEPARTMENT_TYPE_CODE, 
    REQUEST_PARAM_FLAG, 
    REQUEST_PARAM_FROM_DATE, 
    REQUEST_PARAM_HOSPITAL_ID, 
    REQUEST_PARAM_TO_DATE, 
    STATUS_D, 
    STATUS_P,
    OPD_BILLING_REGISTER_END_URL
} from "../../../config/apiConfig";
import { 
    FAIL_TO_LOAD_DOCTORS_ERR_MSG, 
    FROM_DATE_FUTURE_ERR_MSG, 
    PAST_DATE_PICK_WARN_MSG, 
    REPORT_GENERATION_ERR_MSG, 
    SELECT_DATE_WARN_MSG, 
    TO_DATE_FUTURE_ERR_MSG 
} from "../../../config/constants";

const OPDBillingRegister = () => {
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    
    const [isViewLoading, setIsViewLoading] = useState(false);
    const [isPrintLoading, setIsPrintLoading] = useState(false);
    const [popupMessage, setPopupMessage] = useState(null);
    const [pdfUrl, setPdfUrl] = useState(null);
    
    const [departmentOptions, setDepartmentOptions] = useState([]);
    const [doctorOptions, setDoctorOptions] = useState([]);

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

    const fetchDepartments = async () => {
        try {
            const response = await getRequest(`${GET_ALL_ACT_MAS_DEPT_FOR_DROPDOWN_END_URL}?${REQUEST_PARAM_DEPARTMENT_TYPE_CODE}=${FILTER_OPD_DEPT}`);
            if (response?.response) {
                setDepartmentOptions(response.response);
            }
        } catch (error) {
            console.error("Error fetching departments:", error);
        }
    };

    const fetchDoctorsByDepartment = async (departmentId) => {
        try {
            setDoctorOptions([]);
            setSelectedDoctor(null);
            if (!departmentId) return;

            const response = await getRequest(`${DOCTOR_BY_SPECIALITY}${departmentId}`);
            if (response?.status === 200 && response?.response) {
                const mappedDoctors = response.response.map(doc => ({
                    id: doc.userId,
                    name: `${doc.firstName} ${doc.middleName ? doc.middleName + ' ' : ''}${doc.lastName}`.trim()
                }));
                setDoctorOptions(mappedDoctors);
            }
        } catch (error) {
            console.error("Error fetching doctors:", error);
            showPopup(FAIL_TO_LOAD_DOCTORS_ERR_MSG, "error");
        }
    };

    const handleDepartmentChange = (e) => {
        const selectedDeptId = e.target.value;
        const selectedDept = departmentOptions.find(dept => dept.id.toString() === selectedDeptId);
        setSelectedDepartment(selectedDept || null);
        setSelectedDoctor(null);
        setDoctorOptions([]);
        if (selectedDeptId) {
            fetchDoctorsByDepartment(selectedDeptId);
        }
    };

    const handleDoctorChange = (e) => {
        const selectedDoctorId = e.target.value;
        const doctor = doctorOptions.find(doc => doc.id.toString() === selectedDoctorId);
        setSelectedDoctor(doctor || null);
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

    // Helper function to fetch PDF (same as ViewDownLoadReport)
    const fetchPdf = async (flag) => {
        const params = new URLSearchParams({
            [REQUEST_PARAM_HOSPITAL_ID]: hospitalId,
            [REQUEST_PARAM_FROM_DATE]: fromDate,
            [REQUEST_PARAM_TO_DATE]: toDate
        });

        if (selectedDepartment?.id) {
            params.append(REQUEST_PARAM_DEPARTMENT_ID, selectedDepartment.id);
        }

        params.append(REQUEST_PARAM_FLAG, flag);

        const reportUrl = `${OPD_BILLING_REGISTER_END_URL}?${params.toString()}`;

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

    // Print functionality exactly like ViewDownLoadReport
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
        setSelectedDepartment(null);
        setSelectedDoctor(null);
        setDoctorOptions([]);
    };

    useEffect(() => {
        setFromDate(getDefaultFromDate());
        setToDate(getTodayDate());
        fetchDepartments();
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
                    name={`OPD Billing Register Report`}
                />
            )}

            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header">
                            <h4 className="card-title p-2 mb-0">OPD BILLING REGISTER</h4>
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
                                        Department
                                    </label>
                                    <select
                                        className="form-select"
                                        value={selectedDepartment?.id || ""}
                                        onChange={handleDepartmentChange}
                                    >
                                        <option value="">Select Department</option>
                                        {departmentOptions.map((dept) => (
                                            <option key={dept.id} value={dept.id}>
                                                {dept.departmentName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label fw-bold">
                                        Doctor
                                    </label>
                                    <select
                                        className="form-select"
                                        value={selectedDoctor?.id || ""}
                                        onChange={handleDoctorChange}
                                        disabled={!selectedDepartment || doctorOptions.length === 0}
                                    >
                                        <option value="">{!selectedDepartment ? "Select department first" : "Select Doctor"}</option>
                                        {doctorOptions.map((doctor) => (
                                            <option key={doctor.id} value={doctor.id}>
                                                {doctor.name}
                                            </option>
                                        ))}
                                    </select>
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

export default OPDBillingRegister;