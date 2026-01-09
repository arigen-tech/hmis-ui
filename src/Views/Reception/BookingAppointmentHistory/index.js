import { useState, useEffect } from "react";
import LoadingScreen from "../../../Components/Loading";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import Popup from "../../../Components/popup";

const BookingAppointmentHistory = () => {
    const [mobileNumber, setMobileNumber] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [popupMessage, setPopupMessage] = useState(null);
    const [reportData, setReportData] = useState([]);

    const departmentOptions = [
        { id: 1, name: "Cardiology" },
        { id: 2, name: "Dermatology" },
        { id: 3, name: "Neurology" },
        { id: 4, name: "Orthopedics" },
        { id: 5, name: "Pediatrics" },
        { id: 6, name: "General Medicine" },
        { id: 7, name: "Dentistry" },
        { id: 8, name: "Ophthalmology" },
    ];

    const getTodayDate = () => {
        return new Date().toISOString().split('T')[0];
    };

    const showPopup = (message, type = "info") => {
        setPopupMessage({
            message,
            type,
            onClose: () => setPopupMessage(null),
        });
    };

    const formatDateForDisplay = (dateString) => {
        if (!dateString) return "";
        try {
            const date = new Date(dateString);
            const day = String(date.getDate()).padStart(2, '0');
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const month = monthNames[date.getMonth()];
            const year = date.getFullYear();
            return `${day}-${month}-${year}`;
        } catch (error) {
            return "";
        }
    };

    const handleSearch = () => {
        if (!mobileNumber.trim() && !selectedDepartment) {
            showPopup("Please enter Mobile Number or select Department", "error");
            return;
        }

        if (mobileNumber.trim() && !/^\d{10}$/.test(mobileNumber.trim())) {
            showPopup("Please enter a valid 10-digit mobile number", "error");
            return;
        }

        setIsGenerating(true);

        setTimeout(() => {
            const mockData = generateMockData();
            setReportData(mockData);
            setShowReport(true);
            setIsGenerating(false);
        }, 1000);
    };

    const generateMockData = () => {
        const mockData = [];
        const departments = ["Cardiology", "Dermatology", "Neurology", "Orthopedics", "Pediatrics", "General Medicine"];
        const doctors = ["Dr. Sharma", "Dr. Patel", "Dr. Kumar", "Dr. Singh", "Dr. Gupta", "Dr. Joshi"];
        const timeSlots = ["09:00 AM - 10:00 AM", "10:00 AM - 11:00 AM", "11:00 AM - 12:00 PM", "02:00 PM - 03:00 PM", "03:00 PM - 04:00 PM", "04:00 PM - 05:00 PM"];

        for (let i = 1; i <= 12; i++) {
            const deptIndex = i % departments.length;
            const docIndex = i % doctors.length;
            const slotIndex = i % timeSlots.length;
            const appointmentDate = new Date(2024, 11, i + 10);

            mockData.push({
                patientName: `Patient ${i}`,
                mobileNumber: mobileNumber.trim() || `98765432${i}`,
                patientAge: Math.floor(Math.random() * 50) + 20,
                appointmentDate: formatDateForDisplay(appointmentDate.toISOString()),
                doctorName: doctors[docIndex],
                departmentName: departments[deptIndex],
                appointmentSlot: timeSlots[slotIndex],
            });
        }

        return mockData;
    };

    const handleReschedule = (patientName, appointmentDate) => {
        showPopup(`Reschedule appointment for ${patientName} on ${appointmentDate}`, "info");
    };

    const handleCancel = (patientName, appointmentDate) => {
        showPopup(`Cancel appointment for ${patientName} on ${appointmentDate}`, "info");
    };

   

    const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
    const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
    const currentItems = reportData.slice(indexOfFirst, indexOfLast);

    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header">
                            <h4 className="card-title p-2 mb-0">APPOINTMENT HISTORY</h4>
                        </div>
                        <div className="card-body">
                            <div className="row mb-4">
                                <div className="col-md-4">
                                    <label className="form-label fw-bold">Mobile Number</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Enter Mobile Number"
                                        value={mobileNumber}
                                        onChange={(e) => setMobileNumber(e.target.value)}
                                        maxLength="10"
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label fw-bold">Department</label>
                                    <select
                                        className="form-select"
                                        value={selectedDepartment}
                                        onChange={(e) => setSelectedDepartment(e.target.value)}
                                    >
                                        <option value="">Select Department</option>
                                        {departmentOptions.map((dept) => (
                                            <option key={dept.id} value={dept.name}>
                                                {dept.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-md-4 d-flex align-items-end">
                                    <button
                                        className="btn btn-success"
                                        onClick={handleSearch}
                                        disabled={isGenerating}
                                    >
                                        {isGenerating ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Searching...
                                            </>
                                        ) : (
                                            "Search"
                                        )}
                                    </button>
                                </div>
                            </div>


                            {isGenerating && (
                                <div className="text-center py-4">
                                    <LoadingScreen />
                                </div>
                            )}

                            {showReport && !isGenerating && reportData.length > 0 && (
                                <div className="row mt-4">
                                    <div className="col-12">
                                        <div className="card">
                                            <div className="card-header">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <h5 className="card-title mb-0">APPOINTMENT HISTORY</h5>
                                                </div>
                                            </div>

                                            <div className="card-body">
                                                <div className="table-responsive">
                                                    <table className="table table-bordered table-hover">
                                                        <thead style={{ backgroundColor: "#9db4c0", color: "black" }}>
                                                            <tr>
                                                                <th>Patient Name</th>
                                                                <th>Mobile Number</th>
                                                                <th>Patient Age</th>
                                                                <th>Doctor Name</th>
                                                                <th>Department Name</th>
                                                                <th>Appointment Date</th>
                                                                <th>Appointment Slot</th>
                                                                <th>Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {currentItems.map((row, index) => (
                                                                <tr key={index}>
                                                                    <td>{row.patientName}</td>
                                                                    <td>{row.mobileNumber}</td>
                                                                    <td>{row.patientAge}</td>
                                                                    <td>{row.doctorName}</td>
                                                                    <td>{row.departmentName}</td>
                                                                    <td>{row.appointmentDate}</td>
                                                                    <td>{row.appointmentSlot}</td>
                                                                    <td>
                                                                        <div className="d-flex gap-2">
                                                                            <button
                                                                                type="button"
                                                                                className="btn btn-primary btn-sm"
                                                                                onClick={() => handleReschedule(row.patientName, row.appointmentDate)}
                                                                            >
                                                                                Reschedule
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                className="btn btn-danger btn-sm"
                                                                                onClick={() => handleCancel(row.patientName, row.appointmentDate)}
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

                                                {reportData.length > DEFAULT_ITEMS_PER_PAGE && (
                                                    <Pagination
                                                        totalItems={reportData.length}
                                                        itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                                                        currentPage={currentPage}
                                                        onPageChange={setCurrentPage}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {showReport && !isGenerating && reportData.length === 0 && (
                                <div className="row mt-4">
                                    <div className="col-12">
                                        <div className="alert alert-info">
                                            No appointment records found for the selected criteria.
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {popupMessage && (
                <Popup
                    message={popupMessage.message}
                    type={popupMessage.type}
                    onClose={popupMessage.onClose}
                />
            )}
        </div>
    );
};

export default BookingAppointmentHistory;