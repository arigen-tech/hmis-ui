import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingScreen from "../../../Components/Loading";
import Pagination from "../../../Components/Pagination";
import Popup from "../../../Components/popup";
import { useLocation } from 'react-router-dom';
import { postRequest } from "../../../service/apiService";
import { FOLLOWUP_PATIENTS_LIST } from "../../../config/apiConfig";

const PatientSearchForAdmission = () => {
    const location = useLocation();

    const navigate = useNavigate();
    const { from, timestamp } = location.state || {};

    const [loading, setLoading] = useState(false);
    const [popupMessage, setPopupMessage] = useState(null);

    const [formData, setFormData] = useState({
        mobileNo: "",
        patientName: "",
    });

    const [patients, setPatients] = useState([]);
    const [searchPerformed, setSearchPerformed] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 5;

    const showPopup = (message, type = "info") => {
        setPopupMessage({
            message,
            type,
            onClose: () => setPopupMessage(null),
        });
    };

    const handleChangeSearch = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSearch = async (page = 1) => {
        setLoading(true);
        setCurrentPage(page);
        try {
            const payload = {
                mobileNo: formData.mobileNo || null,
                patientName: formData.patientName || null
            };
            const response = await postRequest(`${FOLLOWUP_PATIENTS_LIST}?page=${page - 1}&size=${itemsPerPage}`, payload);
            
            if (response?.response) {
                const pageData = response.response;
                setPatients(pageData.content || []);
                setTotalItems(pageData.totalElements || 0);
                setSearchPerformed(true);
                
                if (!pageData.content || pageData.content.length === 0) {
                    showPopup("No patients found matching your search criteria", "info");
                }
            } else {
                setPatients([]);
                setTotalItems(0);
                setSearchPerformed(true);
                showPopup("No patients found", "info");
            }
        } catch (error) {
            console.error("Error searching patients:", error);
            showPopup("Failed to search patients", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setFormData({ mobileNo: "", patientName: "" });
        setPatients([]);
        setSearchPerformed(false);
        setCurrentPage(1);
        setTotalItems(0);
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        handleSearch(1);
    };

    const handleProceedForAdmission = (patient) => {
        navigate("/InpatientAdmission", { state: { patientData: patient } });
    };

    const currentItems = patients;

    // Removed global LoadingScreen return

    return (
        <div className="body d-flex py-3">
            <div className="container-fluid">
                {popupMessage && (
                    <Popup
                        message={popupMessage.message}
                        type={popupMessage.type}
                        onClose={popupMessage.onClose}
                    />
                )}

                <div className="row align-items-center">
                    <div className="border-0 mb-4">
                        <div className="card-header py-3 no-bg bg-transparent d-flex align-items-center px-0 justify-content-between border-bottom flex-wrap">
                            <h3 className="fw-bold mb-0">Search Patient for Admission</h3>
                            <button
                                className="btn btn-secondary ms-auto"
                                onClick={() => navigate(-1)}
                            >
                                <i className="icofont-arrow-left me-1"></i> Back
                            </button>
                        </div>
                    </div>
                </div>

                <div className="row mb-3">
                    <div className="col-sm-12">
                        <div className="card shadow mb-3">
                            <div className="card-header py-3 border-bottom-1">
                                <h6 className="mb-0 fw-bold">Search Patient</h6>
                            </div>
                            <div className="card-body">
                                <form onSubmit={handleFormSubmit}>
                                    <div className="row g-3">
                                        <div className="col-md-3">
                                            <label className="form-label">Mobile No.</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Enter Mobile No."
                                                name="mobileNo"
                                                value={formData.mobileNo}
                                                onChange={handleChangeSearch}
                                                maxLength={10}
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label">Patient Name</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Enter Patient Name"
                                                name="patientName"
                                                value={formData.patientName}
                                                onChange={handleChangeSearch}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-3 mb-3">
                                        <button type="submit" className="btn btn-primary me-2" disabled={loading}>
                                            {loading ? (
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
                                            disabled={loading}
                                        >
                                            Reset
                                        </button>
                                    </div>

                                    {loading ? (
                                        <div className="col-md-12 text-center p-5">
                                            <div className="spinner-border text-primary" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                            <p className="mt-2 text-muted">Searching patients...</p>
                                        </div>
                                    ) : (
                                        <>
                                            {searchPerformed && patients.length > 0 && (
                                                <div className="col-md-12">
                                                    <div className="table-responsive packagelist">
                                                        <table className="table table-bordered table-hover align-middle">
                                                            <thead className="table-light">
                                                                <tr>
                                                                    <th>Patient Name</th>
                                                                    <th>Mobile No.</th>
                                                                    <th>UHID No.</th>
                                                                    <th>Age</th>
                                                                    <th>Gender</th>
                                                                    <th>Email</th>
                                                                    <th>ABHA ID</th>
                                                                    <th>Action</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {currentItems.map((patient) => {
                                                                    const fullName = [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(" ");
                                                                    return (
                                                                    <tr key={patient.patientId || patient.id || patient.uhidNo} className="table-row-hover">
                                                                        <td>{fullName || patient.patientName || patient.fullName || "N/A"}</td>
                                                                        <td>{patient.mobileNo || patient.patientMobileNumber || "N/A"}</td>
                                                                        <td>{patient.uhidNo || patient.uhid || "N/A"}</td>
                                                                        <td>{patient.age || patient.patientAge || "N/A"}</td>
                                                                        <td>{patient.gender || "N/A"}</td>
                                                                        <td>{patient.email || patient.emailId || patient.patientEmailId || "N/A"}</td>
                                                                        <td>{patient.abhaNo || patient.abhaId || patient.patientAbhaId || "N/A"}</td>
                                                                        <td>
                                                                            <button
                                                                                type="button"
                                                                                className="btn btn-success btn-sm"
                                                                                onClick={() =>
                                                                                    handleProceedForAdmission(patient)
                                                                                }
                                                                            >
                                                                                Proceed for Admission
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                )})}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}

                                            {searchPerformed && patients.length === 0 && (
                                                <div className="alert alert-info d-flex justify-content-between align-items-center" role="alert">
                                                    <span>No patients found matching your search criteria.</span>
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-dark btn-sm"
                                                        onClick={() => navigate("/NewPatientAppointment")}
                                                    >
                                                        Register New Patient
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </form>

                                {searchPerformed && patients.length > 0 && (
                                    <Pagination
                                        totalItems={totalItems}
                                        itemsPerPage={itemsPerPage}
                                        currentPage={currentPage}
                                        onPageChange={handleSearch}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientSearchForAdmission;