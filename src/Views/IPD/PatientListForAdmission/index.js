import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import { getRequest } from "../../../service/apiService";
import Pagination from "../../../Components/Pagination";
import LoadingScreen from "../../../Components/Loading";
import { useNavigate } from "react-router-dom";

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
    const itemsPerPage = 10;

    const [popupMessage, setPopupMessage] = useState(null);

    const admissionTypeOptions = [
        { value: "", label: "All Types" },
        { value: "Planned", label: "Planned" },
        { value: "Emergency", label: "Emergency" }
    ];

    const admissionSourceOptions = [
        { value: "", label: "All Sources" },
        { value: "OPD", label: "OPD" },
        { value: "Emergency", label: "Emergency" },
        { value: "Referral", label: "Referral" }
    ];

    const careLevelOptions = [
        { value: "", label: "All Levels" },
        { value: "GW", label: "General Ward (GW)" },
        { value: "CW", label: "Critical Ward (CW)" },
        { value: "ICU", label: "ICU" },
        { value: "HDU", label: "HDU" },
        { value: "Private", label: "Private Room" }
    ];

    const mockPatientData = [
        {
            id: 1,
            patientName: "Ramesh Kumar",
            mobileNo: "9812345678",
            age: 45,
            gender: "M",
            admissionAdviseDate: "2024-08-15",
            doctorName: "Dr. Verma",
            department: "Medicine",
            ward: "GW",
            bedNo: "101",
            admissionType: "Planned",
            admissionSource: "OPD",
            careLevel: "General",
            status: "Pending"
        },
        {
            id: 2,
            patientName: "Sunita Sharma",
            mobileNo: "9712345678",
            age: 32,
            gender: "F",
            admissionAdviseDate: "2024-08-15",
            doctorName: "Dr. Mehta",
            department: "Gynae",
            ward: "CW",
            bedNo: "205",
            admissionType: "Emergency",
            admissionSource: "Emergency",
            careLevel: "Critical",
            status: "Pending"
        },
        {
            id: 3,
            patientName: "Mohan Das",
            mobileNo: "9912345678",
            age: 60,
            gender: "M",
            admissionAdviseDate: "2024-08-14",
            doctorName: "Dr. Rao",
            department: "Cardiology",
            ward: "ICU",
            bedNo: "ICU-01",
            admissionType: "Planned",
            admissionSource: "Referral",
            careLevel: "ICU",
            status: "Pending"
        },
        {
            id: 4,
            patientName: "Anjali Singh",
            mobileNo: "9812345679",
            age: 28,
            gender: "F",
            admissionAdviseDate: "2024-08-16",
            doctorName: "Dr. Gupta",
            department: "Pediatrics",
            ward: "GW",
            bedNo: "110",
            admissionType: "Planned",
            admissionSource: "OPD",
            careLevel: "General",
            status: "Pending"
        }
    ];

    const fetchPatientData = async () => {
        try {
            setLoading(true);
            setError(null);

            await new Promise(resolve => setTimeout(resolve, 1000));

            setPatientList(mockPatientData);

        } catch (err) {
            console.error("Error fetching patient data:", err);
            setError("Failed to load patient data. Please try again.");
            showPopup("Failed to load patient data", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatientData();
    }, []);

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
        console.log("Searching with:", searchParams);
        showPopup("Search applied", "success");
    };

    const handleResetSearch = () => {
        setSearchParams({
            mobileNo: "",
            patientName: "",
            admissionAdviseDate: ""
        });
        setCurrentPage(1);
        fetchPatientData();
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

    const filteredPatients = patientList.filter(patient => {
        const matchesMobile = searchParams.mobileNo === "" ||
            patient.mobileNo.includes(searchParams.mobileNo);

        const matchesName = searchParams.patientName === "" ||
            patient.patientName.toLowerCase().includes(searchParams.patientName.toLowerCase());

        const matchesDate = searchParams.admissionAdviseDate === "" ||
            patient.admissionAdviseDate === searchParams.admissionAdviseDate;

        return matchesMobile && matchesName && matchesDate;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentPatients = filteredPatients.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);

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
                            <button
                                className="btn btn-primary"
                                onClick={handleNewAdmission}
                            >
                                <i className="mdi mdi-plus me-1"></i> New Admission
                            </button>
                        </div>

                        <div className="card-body">
                            {error && (
                                <div className="alert alert-danger" role="alert">
                                    <i className="mdi mdi-alert-circle"></i> {error}
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-danger ms-2"
                                        onClick={fetchPatientData}
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

                                        <div className="col-md-3">
                                            <label className="form-label fw-bold">Admission Advise Date</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                name="admissionAdviseDate"
                                                value={searchParams.admissionAdviseDate}
                                                onChange={handleSearchChange}
                                            />
                                        </div>

                                        <div className="col-md-3 d-flex align-items-end gap-2">
                                            <button
                                                type="submit"
                                                className="btn btn-primary"
                                            >
                                                <i className="mdi mdi-magnify me-1"></i> Search
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={handleResetSearch}
                                            >
                                                <i className="mdi mdi-refresh me-1"></i> Reset
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>

                            {filteredPatients.length === 0 ? (
                                <div className="alert alert-info" role="alert">
                                    <i className="mdi mdi-information-outline"></i> No patients found matching your search criteria.
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
                                                <th>Ward / Bed</th>
                                                <th>Admission Type</th>
                                                <th>Admission Source</th>
                                                <th>Care Level</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentPatients.map((patient, index) => (
                                                <tr key={patient.id}>
                                                    <td>{indexOfFirstItem + index + 1}</td>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <div>
                                                                <strong>{patient.patientName}</strong>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>{patient.mobileNo}</td>
                                                    <td>{patient.age} / {patient.gender}</td>
                                                    <td>{formatDate(patient.admissionAdviseDate)}</td>
                                                    <td>{patient.doctorName}</td>
                                                    <td>{patient.department}</td>
                                                    <td>
                                                        <span className="badge bg-light text-dark">
                                                            {patient.ward} - {patient.bedNo}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span
                                                            className={`badge ${patient.admissionType === 'Emergency' ? 'bg-danger' : 'bg-primary'}`}
                                                        >
                                                            {patient.admissionType}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="badge bg-info">
                                                            {patient.admissionSource}
                                                        </span>
                                                    </td>
                                                    <td>
                                                            {patient.careLevel}
                                                    </td>
                                                    <td>
                                                        <div className="d-flex gap-2">
                                                            <button
                                                                className="btn btn-success btn-sm"
                                                                onClick={() => handleAdmitPatient(patient.id)}
                                                                title="Admit Patient"
                                                            >
                                                                <i className="mdi mdi-hospital-building me-1"></i> Admit
                                                            </button>
                                                            <button
                                                                className="btn btn-danger btn-sm"
                                                                onClick={() => handleCancelAdmission(patient.id)}
                                                                title="Cancel Admission"
                                                            >
                                                                <i className="mdi mdi-cancel me-1"></i> Cancel
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {filteredPatients.length > 0 && (
                                <Pagination
                                    totalItems={filteredPatients.length}
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