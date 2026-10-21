import { useState, useEffect } from "react";
import { getRequest } from "../../../service/apiService"; // Adjust path if necessary
import VisitSummaryStats from "../../../Components/VisitSummaryStats"; // Adjust path if necessary
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination"; // Adjust path if necessary
import { PATIENT_VISIT_QUEUE } from "../../../config/apiConfig";

const OpdPatientQueue = () => {
    const [queueData, setQueueData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalElements, setTotalElements] = useState(0);

    // Retrieve IDs from session/local storage
    const hospitalId = sessionStorage.getItem("hospitalId") || localStorage.getItem("hospitalId");
    const doctorId = sessionStorage.getItem("userId") || localStorage.getItem("userId") ;
    const departmentId = sessionStorage.getItem("departmentId") || localStorage.getItem("departmentId") ;

    const fetchQueueData = async () => {
        try {
            setLoading(true);
            // Note: API expects 0-based page index
            const pageIndex = currentPage - 1; 
            const url = `${PATIENT_VISIT_QUEUE}/${hospitalId}/${doctorId}/${departmentId}?page=${pageIndex}&size=${DEFAULT_ITEMS_PER_PAGE}`;
            
            const res = await getRequest(url);
            
            if (res?.status === 200 && res?.response) {
                setQueueData(res.response.content || []);
                setTotalElements(res.response.totalElements || 0);
            } else {
                setQueueData([]);
                setTotalElements(0);
            }
        } catch (error) {
            console.error("Error fetching OPD queue:", error);
            setQueueData([]);
            setTotalElements(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQueueData();
    }, [currentPage]);

    // Format Time (e.g., "2026-10-21T09:00:00" -> "09:00 AM")
    const formatTime = (timeString) => {
        if (!timeString) return "-";
        const date = new Date(timeString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Map Status to Badge
    const renderStatusBadge = (status) => {
        switch (status) {
            case "y":
                return <span className="badge bg-success text-white px-3 py-2">Completed</span>;
            case "i":
                return <span className="badge bg-primary text-white px-3 py-2">In Consultation</span>;
            case "w":
            default:
                return <span className="badge bg-warning text-dark px-3 py-2">Waiting</span>;
        }
    };

    return (
        <>
            <div className="content-wrapper">
                <div className="row">
                    <div className="col-12 grid-margin stretch-card">
                        <div className="card form-card">
                            {/* Matching Header from GeneralMedicineWaitingList */}
                            <div
                                className="card-header"
                                style={{
                                    background: "linear-gradient(90deg, #5b6bf7 0%, #6f7bf8 100%)",
                                    color: "#fff",
                                    padding: "0.75rem 1.25rem",
                                }}
                            >
                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                                    <h4 className="card-title p-2 mb-0 text-white">
                                        OPD Patient Queue
                                    </h4>
                                    <VisitSummaryStats />
                                </div>
                            </div>

                            <div className="card-body">
                                <div className="table-responsive">
                                    <table className="table table-bordered table-hover align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Time</th>
                                                <th>Status</th>
                                                <th>Patient Name</th>
                                                <th>Gender</th>
                                                <th>Mobile No.</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loading ? (
                                                <tr>
                                                    <td colSpan="5" className="text-center py-4">
                                                        <div className="d-flex justify-content-center align-items-center gap-2">
                                                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                            <span>Loading queue data...</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : queueData.length > 0 ? (
                                                queueData.map((item) => (
                                                    <tr key={item.visitId}>
                                                        <td>{formatTime(item.appointmentStartTime)}</td>
                                                        <td>{renderStatusBadge(item.visitStatus)}</td>
                                                        <td>{item.patientName}</td>
                                                        <td>{item.gender}</td>
                                                        <td>{item.mobileNumber}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="5" className="text-center text-muted">
                                                        No records found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination Component */}
                                {totalElements > 0 && (
                                    <Pagination
                                        totalItems={totalElements}
                                        itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                                        currentPage={currentPage}
                                        onPageChange={setCurrentPage}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default OpdPatientQueue;