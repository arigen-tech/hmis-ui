import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingScreen from "../../../Components/Loading";
import Pagination from "../../../Components/Pagination";
import Popup from "../../../Components/popup";
import { useLocation } from 'react-router-dom';


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
    const itemsPerPage = 5;

    const mockPatientData = [
        {
            id: 1,
            fullName: "Ramesh Kumar",
            patientMobileNumber: "9812345678",
            uhidNo: "UHID001",
            patientAge: 45,
            gender: "M",
            patientEmailId: "ramesh.kumar@example.com",
            patientAbhaId: "12-3456-7890-1234",
        },
        {
            id: 2,
            fullName: "Sunita Sharma",
            patientMobileNumber: "9712345678",
            uhidNo: "UHID002",
            patientAge: 32,
            gender: "F",
            patientEmailId: "sunita.sharma@example.com",
            patientAbhaId: "",
        },
        {
            id: 3,
            fullName: "Mohan Das",
            patientMobileNumber: "9912345678",
            uhidNo: "UHID003",
            patientAge: 60,
            gender: "M",
            patientEmailId: "",
            patientAbhaId: "23-4567-8901-2345",
        },
        {
            id: 4,
            fullName: "Anjali Singh",
            patientMobileNumber: "9812345679",
            uhidNo: "UHID004",
            patientAge: 28,
            gender: "F",
            patientEmailId: "anjali.singh@example.com",
            patientAbhaId: "",
        },
    ];

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

    const handleSearch = async () => {
        setLoading(true);
        setCurrentPage(1);
        try {
            // Simulated API delay - replace with real API call later
            await new Promise((resolve) => setTimeout(resolve, 500));

            const filtered = mockPatientData.filter((patient) => {
                const matchesMobile =
                    formData.mobileNo === "" ||
                    patient.patientMobileNumber.includes(formData.mobileNo);

                const matchesName =
                    formData.patientName === "" ||
                    patient.fullName
                        .toLowerCase()
                        .includes(formData.patientName.toLowerCase());

                return matchesMobile && matchesName;
            });

            setPatients(filtered);
            setSearchPerformed(true);

            if (filtered.length === 0) {
                showPopup("No patients found matching your search criteria", "info");
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
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        handleSearch();
    };

    const handleProceedForAdmission = (patient) => {
        navigate("/InpatientAdmission")
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = patients.slice(indexOfFirstItem, indexOfLastItem);

    if (loading) {
        return <LoadingScreen />;
    }

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
                                        <button type="submit" className="btn btn-primary me-2">
                                            Search
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={handleReset}
                                        >
                                            Reset
                                        </button>
                                    </div>

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
                                                        {currentItems.map((patient) => (
                                                            <tr key={patient.id} className="table-row-hover">
                                                                <td>{patient.fullName}</td>
                                                                <td>{patient.patientMobileNumber}</td>
                                                                <td>{patient.uhidNo}</td>
                                                                <td>{patient.patientAge}</td>
                                                                <td>{patient.gender}</td>
                                                                <td>{patient.patientEmailId}</td>
                                                                <td>{patient.patientAbhaId || "N/A"}</td>
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
                                                        ))}
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
                                </form>

                                {searchPerformed && patients.length > 0 && (
                                    <Pagination
                                        totalItems={patients.length}
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
        </div>
    );
};

export default PatientSearchForAdmission;