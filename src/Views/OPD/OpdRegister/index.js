import { useState } from "react";
import Popup from "../../../Components/popup";

const OPDRegister = () => {
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [department, setDepartment] = useState("");
    const [doctorName, setDoctorName] = useState("");
    const [gender, setGender] = useState("");
    const [icdDiagnosis, setIcdDiagnosis] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [isViewLoading, setIsViewLoading] = useState(false);
    const [isPrintLoading, setIsPrintLoading] = useState(false);
    const [isDiagnosisDropdownVisible, setDiagnosisDropdownVisible] = useState(false);
    const [popupMessage, setPopupMessage] = useState(null);

    // Static dropdown options
    const departmentOptions = [
        { id: 1, name: "General Medicine" },
        { id: 2, name: "Pediatrics" },
        { id: 3, name: "Orthopedics" },
        { id: 4, name: "Cardiology" },
        { id: 5, name: "Dermatology" }
    ];

    const doctorOptions = [
        { id: 1, name: "Dr. Rajesh Kumar" },
        { id: 2, name: "Dr. Priya Singh" },
        { id: 3, name: "Dr. Amit Sharma" },
        { id: 4, name: "Dr. Sneha Patel" },
        { id: 5, name: "Dr. Vikram Malhotra" }
    ];

    const genderOptions = [
        { id: 1, name: "Male" },
        { id: 2, name: "Female" },
        { id: 3, name: "Other" }
    ];

    // ICD Diagnosis options for autocomplete
    const icdDiagnosisOptions = [
        { id: 1, code: "A00", name: "Cholera" },
        { id: 2, code: "A01", name: "Typhoid and paratyphoid fevers" },
        { id: 3, code: "A02", name: "Other salmonella infections" },
        { id: 4, code: "A03", name: "Shigellosis" },
        { id: 5, code: "A04", name: "Other bacterial intestinal infections" },
        { id: 6, code: "A05", name: "Other bacterial foodborne intoxications" },
        { id: 7, code: "A06", name: "Amoebiasis" },
        { id: 8, code: "A07", name: "Other protozoal intestinal diseases" },
        { id: 9, code: "A08", name: "Viral and other specified intestinal infections" },
        { id: 10, code: "A09", name: "Other gastroenteritis and colitis of infectious and unspecified origin" },
        { id: 11, code: "E10", name: "Type 1 diabetes mellitus" },
        { id: 12, code: "E11", name: "Type 2 diabetes mellitus" },
        { id: 13, code: "I10", name: "Essential (primary) hypertension" },
        { id: 14, code: "I20", name: "Angina pectoris" },
        { id: 15, code: "J00", name: "Acute nasopharyngitis [common cold]" },
        { id: 16, code: "J01", name: "Acute sinusitis" },
        { id: 17, code: "J02", name: "Acute pharyngitis" },
        { id: 18, code: "J03", name: "Acute tonsillitis" },
        { id: 19, code: "J04", name: "Acute laryngitis and tracheitis" },
        { id: 20, code: "J05", name: "Acute obstructive laryngitis [croup] and epiglottitis" }
    ];

    const getTodayDate = () => {
        return new Date().toISOString().split('T')[0];
    };

    const showPopup = (message, type = "info") => {
        setPopupMessage({
            message,
            type,
            onClose: () => {
                setPopupMessage(null);
            },
        });
    };

    const handleFromDateChange = (e) => {
        const selectedDate = e.target.value;
        const today = getTodayDate();

        if (selectedDate > today) {
            showPopup("From date cannot be in the future", "warning");
            return;
        }

        setFromDate(selectedDate);

        if (toDate && selectedDate > toDate) {
            setToDate("");
        }
    };

    const handleToDateChange = (e) => {
        const selectedDate = e.target.value;
        const today = getTodayDate();

        if (selectedDate > today) {
            showPopup("To date cannot be in the future", "warning");
            return;
        }

        if (fromDate && selectedDate < fromDate) {
            showPopup("To date cannot be earlier than From date", "warning");
            return;
        }

        setToDate(selectedDate);
    };

    const handleIcdDiagnosisChange = (e) => {
        setIcdDiagnosis(e.target.value);
        setDiagnosisDropdownVisible(true);
    };

    const handleIcdDiagnosisSelect = (diagnosis) => {
        setIcdDiagnosis(`${diagnosis.code} - ${diagnosis.name}`);
        setDiagnosisDropdownVisible(false);
    };

    const validateDates = () => {
        if (!fromDate || !toDate) {
            showPopup("Please select both From Date and To Date", "warning");
            return false;
        }

        if (new Date(fromDate) > new Date(toDate)) {
            showPopup("To Date cannot be earlier than From Date", "warning");
            return false;
        }

        return true;
    };

    const handleSearch = () => {
        if (!validateDates()) return;

        setIsSearching(true);
        // Simulate search
        setTimeout(() => {
            setIsSearching(false);
            showPopup("Search completed successfully!", "success");
        }, 1500);
    };

    const handleReset = () => {
        setFromDate("");
        setToDate("");
        setDepartment("");
        setDoctorName("");
        setGender("");
        setIcdDiagnosis("");
        showPopup("Filters reset successfully", "info");
    };

    const handleViewReport = () => {
        if (!validateDates()) return;

        setIsViewLoading(true);
        // Simulate PDF generation
        setTimeout(() => {
            setIsViewLoading(false);
            showPopup("Report generated successfully!", "success");
        }, 1500);
    };

    const handlePrintReport = () => {
        if (!validateDates()) return;

        setIsPrintLoading(true);
        // Simulate print
        setTimeout(() => {
            setIsPrintLoading(false);
            showPopup("Report sent to printer successfully!", "success");
        }, 1500);
    };

    return (
        <div className="content-wrapper">
            {popupMessage && (
                <Popup
                    message={popupMessage.message}
                    type={popupMessage.type}
                    onClose={popupMessage.onClose}
                />
            )}

            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header">
                            <h4 className="card-title p-2 mb-0">
                                OPD Register
                            </h4>
                        </div>
                        <div className="card-body">
                            <div className="row mb-4">
                                <div className="col-md-4">
                                    <label className="form-label fw-bold">Department </label>
                                    <select
                                        className="form-select"
                                        value={department}
                                        onChange={(e) => setDepartment(e.target.value)}
                                    >
                                        <option value="">Select Department</option>
                                        {departmentOptions.map((dept) => (
                                            <option key={dept.id} value={dept.name}>
                                                {dept.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label fw-bold">Doctor Name </label>
                                    <select
                                        className="form-select"
                                        value={doctorName}
                                        onChange={(e) => setDoctorName(e.target.value)}
                                    >
                                        <option value="">Select Doctor</option>
                                        {doctorOptions.map((doctor) => (
                                            <option key={doctor.id} value={doctor.name}>
                                                {doctor.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label fw-bold">Gender</label>
                                    <select
                                        className="form-select"
                                        value={gender}
                                        onChange={(e) => setGender(e.target.value)}
                                    >
                                        <option value="">Select Gender</option>
                                        {genderOptions.map((g) => (
                                            <option key={g.id} value={g.name}>
                                                {g.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="row mb-4">
                                <div className="col-md-4">
                                    <label className="form-label fw-bold">From Date <span className="text-danger">*</span></label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={fromDate}
                                        max={getTodayDate()}
                                        onChange={handleFromDateChange}
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label fw-bold">To Date <span className="text-danger">*</span></label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={toDate}
                                        min={fromDate}
                                        max={getTodayDate()}
                                        onChange={handleToDateChange}
                                    />
                                </div>

                                <div className="col-md-4 mb-4">
                                        <label className="form-label fw-bold">ICD Diagnosis</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Type ICD code or diagnosis name"
                                            value={icdDiagnosis}
                                            onChange={handleIcdDiagnosisChange}
                                            onFocus={() => setDiagnosisDropdownVisible(true)}
                                            onBlur={() => setTimeout(() => setDiagnosisDropdownVisible(false), 200)}
                                            autoComplete="off"
                                        />
                                        {isDiagnosisDropdownVisible && icdDiagnosis && (
                                            <ul className="list-group position-absolute w-100 mt-1" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                                                {icdDiagnosisOptions
                                                    .filter((diag) =>
                                                        diag.code.toLowerCase().includes(icdDiagnosis.toLowerCase()) ||
                                                        diag.name.toLowerCase().includes(icdDiagnosis.toLowerCase())
                                                    )
                                                    .map((diag) => (
                                                        <li
                                                            key={diag.id}
                                                            className="list-group-item list-group-item-action"
                                                            onClick={() => handleIcdDiagnosisSelect(diag)}
                                                            style={{ cursor: 'pointer' }}
                                                        >
                                                            <strong>{diag.code}</strong> - {diag.name}
                                                        </li>
                                                    ))}
                                                {icdDiagnosisOptions.filter((diag) =>
                                                    diag.code.toLowerCase().includes(icdDiagnosis.toLowerCase()) ||
                                                    diag.name.toLowerCase().includes(icdDiagnosis.toLowerCase())
                                                ).length === 0 && (
                                                        <li className="list-group-item text-muted">No matching diagnoses found</li>
                                                    )}
                                            </ul>
                                        )}
                                </div>
                            </div>



                            <div className="row">
                                <div className="col-12 d-flex justify-content-between">
                                    <div className="d-flex gap-2">
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            onClick={handleSearch}
                                            disabled={isSearching || isViewLoading || isPrintLoading}
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
                                            className="btn btn-secondary"
                                            onClick={handleReset}
                                            disabled={isSearching || isViewLoading || isPrintLoading}
                                        >
                                            Reset
                                        </button>
                                    </div>

                                    <div className="d-flex gap-2">
                                        <button
                                            type="button"
                                            className="btn btn-success"
                                            onClick={handleViewReport}
                                            disabled={isSearching || isViewLoading || isPrintLoading}
                                        >
                                            {isViewLoading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Generating...
                                                </>
                                            ) : (
                                                "View Report"
                                            )}
                                        </button>

                                        <button
                                            type="button"
                                            className="btn btn-warning"
                                            onClick={handlePrintReport}
                                            disabled={isSearching || isViewLoading || isPrintLoading}
                                        >
                                            {isPrintLoading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Printing...
                                                </>
                                            ) : (
                                                "Print Report"
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OPDRegister;