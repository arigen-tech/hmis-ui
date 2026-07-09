import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import { getRequest } from "../../../service/apiService";
import Pagination from "../../../Components/Pagination";
import LoadingScreen from "../../../Components/Loading";
import { useNavigate } from "react-router-dom";
import { IPD_PATIENT_WAITING_LIST } from "../../../config/apiConfig";

const PatientListForAdmission = () => {
    const [patientList, setPatientList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const [searchParams, setSearchParams] = useState({
        mobileNo: "",
        patientName: "",
        admissionAdviseDate: ""
    });

    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 10;

    const [popupMessage, setPopupMessage] = useState(null);

    const fetchPatientData = async (page = 1, search = searchParams) => {
        try {
            setLoading(true);
            setError(null);

            const hospitalId = sessionStorage.getItem("hospitalId") || localStorage.getItem("hospitalId") || 12;

            const params = new URLSearchParams({
                page: page - 1,
                size: itemsPerPage,
                hospitalId: hospitalId
            });

            if (search.mobileNo) params.append("mobileNo", search.mobileNo);
            if (search.patientName) params.append("patientName", search.patientName);

            const response = await getRequest(`${IPD_PATIENT_WAITING_LIST}?${params.toString()}`);

            if (response.status === 200 && response.response) {
                setPatientList(response.response.content || []);
                setTotalItems(response.response.totalElements || 0);
            } else {
                setPatientList([]);
                setTotalItems(0);
            }

        } catch (err) {
            console.error("Error fetching patient data:", err);
            setError("Failed to load patient data. Please try again.");
            showPopup("Failed to load patient data", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatientData(currentPage, searchParams);
    }, [currentPage]);

    const showPopup = (message, type = "info") => {
        setPopupMessage({
            message,
            type,
            onClose: () => {
                setPopupMessage(null);
            },
        });
    };

    const handleSearchChange = (e) => {
        const { name, value } = e.target;
        setSearchParams(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchPatientData(1, searchParams);
        showPopup("Search applied", "success");
    };

    const handleResetSearch = () => {
        const resetParams = {
            mobileNo: "",
            patientName: "",
            admissionAdviseDate: ""
        };
        setSearchParams(resetParams);
        setCurrentPage(1);
        fetchPatientData(1, resetParams);
        showPopup("Search filters cleared", "info");
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-GB');
        } catch (error) {
            return dateString;
        }
    };

    const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
    const currentPatients = patientList;

    const handleAdmitPatient = (patientId) => {
        console.log("Admitting patient:", patientId);
        showPopup(`Patient admission initiated for ID: ${patientId}`, "success");
    };

    const handleCancelAdmission = (patientId) => {
        console.log("Cancelling admission for:", patientId);
        showPopup(`Admission cancelled for ID: ${patientId}`, "warning");
    };

    const handleNewAdmission = () => {
        navigate("/InpatientAdmission");
    };

    if (loading) {
        return <LoadingScreen />;
    }

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
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h4 className="card-title p-2 mb-0">Patient List for Admission</h4>

                        </div>

                        <div className="card-body">
                            {error && (
                                <div className="alert alert-danger" role="alert">
                                    {error}
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-danger ms-2"
                                        onClick={() => fetchPatientData(currentPage, searchParams)}
                                    >
                                        Retry
                                    </button>
                                </div>
                            )}

                            <div className=" mb-4">
                                <form onSubmit={handleSearch}>
                                    <div className="row g-3 align-items-end">
                                        <div className="col-md-3">
                                            <label className="form-label fw-bold">Mobile No.</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="mobileNo"
                                                placeholder="Enter mobile number"
                                                value={searchParams.mobileNo}
                                                onChange={handleSearchChange}
                                                maxLength={10}
                                            />
                                        </div>

                                        <div className="col-md-3">
                                            <label className="form-label fw-bold">Patient Name</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="patientName"
                                                placeholder="Enter patient name"
                                                value={searchParams.patientName}
                                                onChange={handleSearchChange}
                                            />
                                        </div>




                                        <div className="col-md-3 d-flex align-items-end gap-2">
                                            <button
                                                type="submit"
                                                className="btn btn-primary"
                                            >
                                                Search
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={handleResetSearch}
                                            >
                                                Reset
                                            </button>
                                        </div>
                                        <div className="col-md-3 d-flex align-items-center gap-2">
                                            <button
                                                className="btn"
                                                onClick={handleNewAdmission}
                                                style={{
                                                    backgroundColor: "#0d6efd",
                                                    color: "white"
                                                }}
                                              
                                            >
                                                + New Admission
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>

                            {totalItems === 0 ? (
                                <div className="alert alert-info" role="alert">
                                    No patients found matching your search criteria.
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-bordered table-hover align-middle">
                                        <thead>
                                            <tr>
                                                <th>Sr. NO</th>
                                                <th>Patient Name</th>
                                                <th>Mobile No</th>
                                                <th>Age / Gender</th>
                                                <th>Admission Advise Date</th>
                                                <th>Doctor</th>
                                                <th>Department</th>
                                                <th>Ward</th>
                                                <th>Admission Type</th>
                                                <th>Admission Source</th>
                                                <th>Care Level</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentPatients.map((patient, index) => (
                                                <tr key={patient.opdPatientDetailsId || index}>
                                                    <td>{indexOfFirstItem + index + 1}</td>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <div>
                                                                <strong>{patient.patientName}</strong>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>{patient.patientMobileNo || patient.mobileNo}</td>
                                                    <td>{patient.age} / {patient.gender}</td>
                                                    <td>{formatDate(patient.admissionAdviseDate)}</td>
                                                    <td>{patient.doctorName}</td>
                                                    <td>{patient.department}</td>
                                                    <td>
                                                        <span className="badge bg-light text-dark">
                                                            {patient.wardName || patient.ward}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {patient.admissionType ? (
                                                            <span
                                                                className={`badge ${patient.admissionType === 'Emergency' ? 'bg-danger' : 'bg-primary'}`}
                                                            >
                                                                {patient.admissionType}
                                                            </span>
                                                        ) : (
                                                            ''
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className="badge bg-info">
                                                            {patient.admissionSource || '-'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {patient.careLevel || patient.careLevelName}
                                                    </td>
                                                    <td>
                                                        <div className="d-flex gap-2">
                                                            <button
                                                                className="btn btn-success btn-sm"
                                                                onClick={() => handleAdmitPatient(patient.opdPatientDetailsId)}
                                                                title="Admit Patient"
                                                            >
                                                                Admit
                                                            </button>
                                                            <button
                                                                className="btn btn-danger btn-sm"
                                                                onClick={() => handleCancelAdmission(patient.opdPatientDetailsId)}
                                                                title="Cancel Admission"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {totalItems > 0 && (
                                <Pagination
                                    totalItems={totalItems}
                                    itemsPerPage={itemsPerPage}
                                    currentPage={currentPage}
                                    onPageChange={setCurrentPage}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientListForAdmission;