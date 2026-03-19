import { useState, useEffect, useRef } from "react";
import Popup from "../../../Components/popup";
import { getRequest } from "../../../service/apiService";
import PdfViewer from "../../../Components/PdfViewModel/PdfViewer";
import { DOCTOR_BY_SPECIALITY, FILTER_OPD_DEPT, GET_ALL_ACT_MAS_DEPT_FOR_DROPDOWN_END_URL, OPD_REGISTER_END_URL, REQUEST_PARAM_DEPARTMENT_ID, REQUEST_PARAM_DEPARTMENT_TYPE_CODE, REQUEST_PARAM_DOCTOR_ID, REQUEST_PARAM_FLAG, REQUEST_PARAM_GENDER_ID, REQUEST_PARAM_ICD_ID, STATUS_D, REQUEST_PARAM_TO_DATE, REQUEST_PARAM_FROM_DATE, REQUEST_PARAM_HOSPITAL_ID, MAS_GENDER_GET_ALL_END_URL, MAS_ICD_GET_ALL_END_URL, ACTIVE_STATUS_FOR_DROPDOWN, REQUEST_PARAM_PAGE, ELEMENT_SIZE_PER_PAGE_FOR_ICD, REQUEST_PARAM_SEARCH, REQUEST_PARAM_SIZE, STATUS_P } from "../../../config/apiConfig";
import { DAY_RANGE_FOR_OPD_REGISTER, DEBOUNCE_SEARCH_IN_MILLIS, EXCEDED_DAY_SELECTION_WARN, FAIL_TO_LOAD_DOCTORS_ERR_MSG, FROM_DATE_FUTURE_ERR_MSG, PAST_DATE_PICK_WARN_MSG, REPORT_GENERATION_ERR_MSG, SELECT_DATE_WARN_MSG, TO_DATE_FUTURE_ERR_MSG } from "../../../config/constants";

const OPDRegister = () => {
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState(null); // Changed to object

    // State for Doctor with object
    const [selectedDoctor, setSelectedDoctor] = useState(null); // New object state

    // State for Gender with object
    const [selectedGender, setSelectedGender] = useState(null); // New object state

    // State for ICD Diagnosis with debounce (already using object)
    const [icdDiagnosis, setIcdDiagnosis] = useState("");
    const [selectedIcd, setSelectedIcd] = useState(null);
    const [icdDropdown, setIcdDropdown] = useState([]);
    const [icdSearch, setIcdSearch] = useState("");
    const [icdPage, setIcdPage] = useState(0);
    const [icdLastPage, setIcdLastPage] = useState(true);
    const [showIcdDropdown, setShowIcdDropdown] = useState(false);
    const [isIcdLoading, setIsIcdLoading] = useState(false);

    // State for dropdown options
    const [departmentOptions, setDepartmentOptions] = useState([]);
    const [doctorOptions, setDoctorOptions] = useState([]);
    const [genderOptions, setGenderOptions] = useState([]);

    // State for loading and reports
    const [isViewLoading, setIsViewLoading] = useState(false);
    const [isPrintLoading, setIsPrintLoading] = useState(false);
    const [popupMessage, setPopupMessage] = useState(null);

    const [pdfUrl, setPdfUrl] = useState(null);


    // Refs for debounce and dropdown
    const debounceIcdRef = useRef(null);
    const dropdownIcdRef = useRef(null);

    const hospitalId = sessionStorage.getItem("hospitalId");

    // Initialize dates on component mount
    useEffect(() => {
        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - DAY_RANGE_FOR_OPD_REGISTER);

        setToDate(formatDateForInput(today));
        setFromDate(formatDateForInput(sevenDaysAgo));

        // Load dropdown data
        fetchDepartments();
        fetchGenders();
    }, []);

    // Format date to YYYY-MM-DD for input fields
    const formatDateForInput = (date) => {
        return date.toISOString().split('T')[0];
    };

    // Calculate date 7 days before given date
    const getDateMinusDays = (date, days) => {
        const newDate = new Date(date);
        newDate.setDate(newDate.getDate() - days);
        return formatDateForInput(newDate);
    };

    // Fetch departments from API
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

    // Fetch doctors based on selected department
    const fetchDoctorsByDepartment = async (departmentId) => {
        try {
            setDoctorOptions([]); // Clear existing doctors
            setSelectedDoctor(null); // Reset selected doctor

            if (!departmentId) return;

            const response = await getRequest(`${DOCTOR_BY_SPECIALITY}${departmentId}`);

            if (response?.status === 200 && response?.response) {
                // Map the response to doctor options format
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

    // Handle department change
    const handleDepartmentChange = (e) => {
        const selectedDeptId = e.target.value;
        const selectedDept = departmentOptions.find(dept => dept.id.toString() === selectedDeptId);

        setSelectedDepartment(selectedDept || null);
        setSelectedDoctor(null); // Reset doctor selection
        setDoctorOptions([]); // Clear doctor options

        // Fetch doctors for selected department
        if (selectedDeptId) {
            fetchDoctorsByDepartment(selectedDeptId);
        }
    };

    // Handle doctor change
    const handleDoctorChange = (e) => {
        const selectedDoctorId = e.target.value;
        const doctor = doctorOptions.find(doc => doc.id.toString() === selectedDoctorId);
        setSelectedDoctor(doctor || null);
    };

    // Handle gender change
    const handleGenderChange = (e) => {
        const selectedGenderId = e.target.value;
        const gender = genderOptions.find(g => g.id.toString() === selectedGenderId);
        setSelectedGender(gender || null);
    };

    // Fetch genders from API
    const fetchGenders = async () => {
        try {
            const response = await getRequest(`${MAS_GENDER_GET_ALL_END_URL}/${ACTIVE_STATUS_FOR_DROPDOWN}`);
            if (response?.response) {
                // Filter active genders and map to required format
                const activeGenders = response.response
                    .filter(g => g.status === 'y')
                    .map(g => ({
                        id: g.id,
                        name: g.genderName,
                        code: g.genderCode
                    }));
                setGenderOptions(activeGenders);
            }
        } catch (error) {
            console.error("Error fetching genders:", error);
        }
    };

    // Fetch ICD diagnoses from API with debounce
    const fetchIcdDiagnoses = async (page, searchText = "") => {
        try {
            setIsIcdLoading(true);
            const url = `${MAS_ICD_GET_ALL_END_URL}?${REQUEST_PARAM_FLAG}=${ACTIVE_STATUS_FOR_DROPDOWN}&${REQUEST_PARAM_PAGE}=${page}&${REQUEST_PARAM_SIZE}=${ELEMENT_SIZE_PER_PAGE_FOR_ICD}${searchText ? `&${REQUEST_PARAM_SEARCH}=${encodeURIComponent(searchText)}` : ''}`;
            const response = await getRequest(url);

            if (response.status === 200 && response.response?.content) {
                return {
                    list: response.response.content,
                    last: response.response.last,
                    totalPages: response.response.totalPages,
                    totalElements: response.response.totalElements
                };
            }
            return { list: [], last: true, totalPages: 0, totalElements: 0 };
        } catch (error) {
            console.error("Error fetching ICD diagnoses:", error);
            return { list: [], last: true, totalPages: 0, totalElements: 0 };
        } finally {
            setIsIcdLoading(false);
        }
    };

    // Handle ICD search with debounce
    const handleIcdSearch = (value) => {
        setIcdDiagnosis(value);
        setIcdSearch(value);

        // Clear selection when user types
        if (!value.trim() || (selectedIcd && !value.includes(selectedIcd.icdName))) {
            setSelectedIcd(null);
        }

        // Debounce API call
        if (debounceIcdRef.current) clearTimeout(debounceIcdRef.current);
        debounceIcdRef.current = setTimeout(async () => {
            if (!value.trim()) {
                setIcdDropdown([]);
                setShowIcdDropdown(false);
                return;
            }
            const result = await fetchIcdDiagnoses(0, value);
            setIcdDropdown(result.list);
            setIcdLastPage(result.last);
            setIcdPage(0);
            setShowIcdDropdown(true);
        }, DEBOUNCE_SEARCH_IN_MILLIS);
    };

    // Load first page of ICD diagnoses for dropdown
    const loadFirstIcdPage = async () => {
        if (!icdSearch.trim()) return;
        const result = await fetchIcdDiagnoses(0, icdSearch);
        setIcdDropdown(result.list);
        setIcdLastPage(result.last);
        setIcdPage(0);
        setShowIcdDropdown(true);
    };

    // Load more ICD diagnoses for infinite scroll
    const loadMoreIcd = async () => {
        if (icdLastPage) return;
        const nextPage = icdPage + 1;
        const result = await fetchIcdDiagnoses(nextPage, icdSearch);
        setIcdDropdown(prev => [...prev, ...result.list]);
        setIcdLastPage(result.last);
        setIcdPage(nextPage);
    };

    // Handle ICD selection from dropdown
    const handleIcdSelect = (icd) => {
        setIcdDiagnosis(`${icd.icdCode} - ${icd.icdName}`);
        setSelectedIcd(icd);
        setShowIcdDropdown(false);
    };

    // Handle click outside dropdown
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownIcdRef.current && !dropdownIcdRef.current.contains(e.target)) {
                setShowIcdDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Handle from date change
    const handleFromDateChange = (e) => {
        const selectedDate = e.target.value;
        const today = formatDateForInput(new Date());

        if (selectedDate > today) {
            showPopup(FROM_DATE_FUTURE_ERR_MSG, "warning");
            return;
        }

        setFromDate(selectedDate);

        // Check if to date is within 7 days of from date
        if (toDate) {
            const fromDateTime = new Date(selectedDate).getTime();
            const toDateTime = new Date(toDate).getTime();
            const diffDays = Math.ceil(Math.abs(toDateTime - fromDateTime) / (1000 * 60 * 60 * 24));

            if (diffDays > DAY_RANGE_FOR_OPD_REGISTER) {
                const newToDate = getDateMinusDays(selectedDate, -DAY_RANGE_FOR_OPD_REGISTER);
                setToDate(newToDate);
                showPopup(EXCEDED_DAY_SELECTION_WARN(DAY_RANGE_FOR_OPD_REGISTER));
            }
        }
    };

    // Handle to date change
    const handleToDateChange = (e) => {
        const selectedDate = e.target.value;
        const today = formatDateForInput(new Date());

        if (selectedDate > today) {
            showPopup(TO_DATE_FUTURE_ERR_MSG, "warning");
            return;
        }

        if (fromDate) {
            const fromDateTime = new Date(fromDate).getTime();
            const toDateTime = new Date(selectedDate).getTime();
            const diffDays = Math.ceil(Math.abs(toDateTime - fromDateTime) / (1000 * 60 * 60 * 24));

            if (diffDays > DAY_RANGE_FOR_OPD_REGISTER) {
                showPopup(EXCEDED_DAY_SELECTION_WARN(DAY_RANGE_FOR_OPD_REGISTER), "warning");
                return;
            }

            if (selectedDate < fromDate) {
                showPopup(PAST_DATE_PICK_WARN_MSG, "warning");
                return;
            }
        }

        setToDate(selectedDate);
    };

    const showPopup = (message, type = "info") => {
        setPopupMessage({
            message,
            type,
            onClose: () => setPopupMessage(null)
        });
    };

    const validateDates = () => {
        if (!fromDate || !toDate) {
            showPopup(SELECT_DATE_WARN_MSG, "warning");
            return false;
        }

        const fromDateTime = new Date(fromDate).getTime();
        const toDateTime = new Date(toDate).getTime();
        const diffDays = Math.ceil(Math.abs(toDateTime - fromDateTime) / (1000 * 60 * 60 * 24));

        if (diffDays > DAY_RANGE_FOR_OPD_REGISTER) {
            showPopup(EXCEDED_DAY_SELECTION_WARN(DAY_RANGE_FOR_OPD_REGISTER), "warning");
            return false;
        }

        if (fromDate > toDate) {
            showPopup(PAST_DATE_PICK_WARN_MSG, "warning");
            return false;
        }

        return true;
    };

    const handleReset = () => {
        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - DAY_RANGE_FOR_OPD_REGISTER);

        setFromDate(formatDateForInput(sevenDaysAgo));
        setToDate(formatDateForInput(today));
        setSelectedDepartment(null);
        setSelectedDoctor(null);
        setSelectedGender(null);
        setDoctorOptions([]);
        setIcdDiagnosis("");
        setSelectedIcd(null);
        setIcdSearch("");
        setIcdDropdown([]);
    };


    const generatePdfReport = async (flag) => {
        if (!validateDates()) return;

        try {
            if (flag === STATUS_D) {
                setIsViewLoading(true);
            } else {
                setIsPrintLoading(true);
            }

            setPdfUrl(null);

            const params = new URLSearchParams({
                [REQUEST_PARAM_HOSPITAL_ID]: hospitalId,
                [REQUEST_PARAM_FROM_DATE]: fromDate,
                [REQUEST_PARAM_TO_DATE]: toDate
            });

            if (selectedDepartment?.id) {
                params.append(REQUEST_PARAM_DEPARTMENT_ID, selectedDepartment.id);
            }

            if (selectedDoctor?.id) {
                params.append(REQUEST_PARAM_DOCTOR_ID, selectedDoctor.id);
            }

            if (selectedGender?.id) {
                params.append(REQUEST_PARAM_GENDER_ID, selectedGender.id);
            }

            if (selectedIcd?.icdId) {
                params.append(REQUEST_PARAM_ICD_ID, selectedIcd.icdId);
            }

            params.append(REQUEST_PARAM_FLAG, flag);

            const reportUrl = `${OPD_REGISTER_END_URL}?${params.toString()}`;

            // Fetch the PDF
            const response = await fetch(reportUrl, {
                method: "GET",
                headers: {
                    Accept: "application/pdf",
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch report");
            }

            const blob = await response.blob();
            const fileURL = window.URL.createObjectURL(blob);

            if (flag === STATUS_D) {
                setPdfUrl(fileURL);
            }
        } catch (err) {
            console.error("Error generating PDF:", err);
            showPopup(REPORT_GENERATION_ERR_MSG, "error");
        } finally {
            if (flag === STATUS_D) {
                setIsViewLoading(false);
            } else {
                setIsPrintLoading(false);
            }
        }
    };

    const handleViewReport = () => generatePdfReport(STATUS_D);
    const handlePrintReport = () => generatePdfReport(STATUS_P);

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
                    name={`OPD Register Report`}
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
                                    <label className="form-label fw-bold">Department</label>
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

                                <div className="col-md-4">
                                    <label className="form-label fw-bold">Doctor Name</label>
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
                                    {selectedDepartment && doctorOptions.length === 0 && (
                                        <small className="text-muted">No doctors available for this department</small>
                                    )}
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label fw-bold">Gender</label>
                                    <select
                                        className="form-select"
                                        value={selectedGender?.id || ""}
                                        onChange={handleGenderChange}
                                    >
                                        <option value="">Select Gender</option>
                                        {genderOptions.map((g) => (
                                            <option key={g.id} value={g.id}>
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
                                        max={formatDateForInput(new Date())}
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
                                        max={formatDateForInput(new Date())}
                                        onChange={handleToDateChange}
                                    />
                                </div>

                                <div className="col-md-4 position-relative" ref={dropdownIcdRef}>
                                    <label className="form-label fw-bold">ICD Diagnosis</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Type ICD code or diagnosis name..."
                                        value={icdDiagnosis}
                                        onChange={(e) => handleIcdSearch(e.target.value)}
                                        onClick={loadFirstIcdPage}
                                        autoComplete="off"
                                    />

                                    {/* ICD Diagnosis Dropdown */}
                                    {showIcdDropdown && (
                                        <div
                                            className="border rounded mt-1 bg-white position-absolute w-100"
                                            style={{ maxHeight: "220px", zIndex: 1000, overflowY: "auto" }}
                                            onScroll={(e) => {
                                                if (e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight) {
                                                    loadMoreIcd();
                                                }
                                            }}
                                        >
                                            {isIcdLoading && icdDropdown.length === 0 ? (
                                                <div className="text-center p-3">
                                                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                                                        <span className="visually-hidden">Loading...</span>
                                                    </div>
                                                </div>
                                            ) : icdDropdown.length > 0 ? (
                                                <>
                                                    {icdDropdown.map((icd) => (
                                                        <div
                                                            key={icd.icdId}
                                                            className="p-2 cursor-pointer hover-bg-light"
                                                            onMouseDown={(e) => {
                                                                e.preventDefault();
                                                                handleIcdSelect(icd);
                                                            }}
                                                            style={{ cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}
                                                        >
                                                            <div className="fw-bold">{icd.icdCode} - {icd.icdName}</div>
                                                        </div>
                                                    ))}

                                                    {!icdLastPage && (
                                                        <div className="text-center p-2 text-primary small">
                                                            Scroll to load more...
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="p-2 text-muted text-center">No diagnoses found</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-12 d-flex justify-content-end gap-2">
                                    <button
                                        type="button"
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
                                        className="btn btn-secondary"
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

export default OPDRegister;