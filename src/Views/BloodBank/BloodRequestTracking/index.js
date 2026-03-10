import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";

const BloodRequestTracking = () => {
    const [popupMessage, setPopupMessage] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    
    // Search state from RequestForBlood
    const [inpatientNo, setInpatientNo] = useState("");
    const [patientName, setPatientName] = useState("");
    const [mobileNumber, setMobileNumber] = useState("");

    // Mock data for blood requests
    const [requestData, setRequestData] = useState([
        {
            id: 1,
            requestNo: "BR-00125",
            inpatientNo: "IP-1023",
            patientName: "Ramesh K",
            bloodGroup: "O+",
            component: "PRBC",
            units: 2,
            urgency: "Routine",
            requestedDate: "15-Aug-2025 10:30 AM",
            requiredBy: "15-Aug-2025 02:00 PM",
            trackingStatus: "Cross Matching"
        },
        {
            id: 2,
            requestNo: "BR-00126",
            inpatientNo: "IP-1045",
            patientName: "Sunita S",
            bloodGroup: "B+",
            component: "Platelet",
            units: 1,
            urgency: "Emergency",
            requestedDate: "15-Aug-2025 11:45 AM",
            requiredBy: "ASAP",
            trackingStatus: "Pending"
        },
        {
            id: 3,
            requestNo: "BR-00127",
            inpatientNo: "IP-1108",
            patientName: "Mahesh P",
            bloodGroup: "A-",
            component: "Plasma",
            units: 2,
            urgency: "Routine",
            requestedDate: "15-Aug-2025 09:00 AM",
            requiredBy: "15-Aug-2025 12:00 PM",
            trackingStatus: "Cross Matching"
        },
        {
            id: 4,
            requestNo: "BR-00128",
            inpatientNo: "IP-1123",
            patientName: "Lakshmi N",
            bloodGroup: "AB+",
            component: "PRBC",
            units: 3,
            urgency: "Urgent",
            requestedDate: "15-Aug-2025 01:15 PM",
            requiredBy: "15-Aug-2025 04:00 PM",
            trackingStatus: "Compatibility Testing"
        },
        {
            id: 5,
            requestNo: "BR-00129",
            inpatientNo: "IP-1156",
            patientName: "Venkatesh R",
            bloodGroup: "O-",
            component: "Whole Blood",
            units: 2,
            urgency: "Emergency",
            requestedDate: "15-Aug-2025 02:30 PM",
            requiredBy: "ASAP",
            trackingStatus: "Cross Matching"
        },
        {
            id: 6,
            requestNo: "BR-00130",
            inpatientNo: "IP-1189",
            patientName: "Saraswati K",
            bloodGroup: "B-",
            component: "Platelet",
            units: 1,
            urgency: "Routine",
            requestedDate: "15-Aug-2025 03:45 PM",
            requiredBy: "16-Aug-2025 10:00 AM",
            trackingStatus: "Issued"
        },
        {
            id: 7,
            requestNo: "BR-00131",
            inpatientNo: "IP-1210",
            patientName: "Murugan S",
            bloodGroup: "A+",
            component: "Cryo",
            units: 5,
            urgency: "Urgent",
            requestedDate: "15-Aug-2025 04:20 PM",
            requiredBy: "15-Aug-2025 08:00 PM",
            trackingStatus: "Compatibility Testing"
        },
        {
            id: 8,
            requestNo: "BR-00132",
            inpatientNo: "IP-1245",
            patientName: "Devi P",
            bloodGroup: "AB-",
            component: "PRBC",
            units: 2,
            urgency: "Routine",
            requestedDate: "15-Aug-2025 05:00 PM",
            requiredBy: "16-Aug-2025 09:00 AM",
            trackingStatus: "Cross Matching"
        }
    ]);

    // Filtered requests based on search
    const filteredRequests = requestData.filter(request =>
        request.requestNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.inpatientNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.bloodGroup.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.component.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const handleInpatientChange = (e) => {
        setInpatientNo(e.target.value);
    };

    const handlePatientNameChange = (e) => {
        setPatientName(e.target.value);
    };

    const handleMobileNumberChange = (e) => {
        setMobileNumber(e.target.value);
    };

    const handleSearchClick = () => {
        // This would trigger the actual search with the three parameters
        console.log("Searching with:", { inpatientNo, patientName, mobileNumber });
        setCurrentPage(1);
    };

    const showPopup = (message, type = 'info') => {
        setPopupMessage({
            message,
            type,
            onClose: () => {
                setPopupMessage(null);
            }
        });
    };

    // Get tracking status badge color
   const getTrackingStatusBadge = (status) => {
        switch(status) {
            case "Pending":
                return <span className="badge bg-secondary">Pending</span>;
            case "Cross Matching":
                return <span className="badge bg-warning text-dark">Cross Matching</span>;
            case "Compatibility Testing":
                return <span className="badge bg-info">Compatibility Testing</span>;
            case "Issued":
                return <span className="badge bg-success">Issued</span>;
            case "Rejected":
                return <span className="badge bg-danger">Rejected</span>;
            default:
                return <span className="badge bg-secondary">{status}</span>;
        }
    };

    // Get urgency badge color
    const getUrgencyBadge = (urgency) => {
        switch(urgency) {
            case "Emergency":
                return <span className="badge bg-danger">Emergency</span>;
            case "Urgent":
                return <span className="badge bg-warning text-dark">Urgent</span>;
            case "Routine":
                return <span className="badge bg-info">Routine</span>;
            default:
                return <span className="badge bg-secondary">{urgency}</span>;
        }
    };

    const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
    const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
    const currentItems = filteredRequests.slice(indexOfFirst, indexOfLast);

    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h4 className="card-title">
                                Blood Request Tracking
                            </h4>
                            <div className="d-flex align-items-center">
                                <form className="d-inline-block searchform me-4" role="search">
                                    <div className="input-group searchinput">
                                        <input
                                            type="search"
                                            className="form-control"
                                            placeholder="Search by Request No, Patient, Blood Group..."
                                            aria-label="Search"
                                            value={searchQuery}
                                            onChange={handleSearch}
                                        />
                                        <span className="input-group-text" id="search-icon">
                                            <i className="fa fa-search"></i>
                                        </span>
                                    </div>
                                </form>
                            </div>
                        </div>

                        <div className="card-body">
                            {/* Search Parameters from RequestForBlood */}
                            <div className="row mb-3">
                                <div className="col-sm-12">
                                    <div className="card-body">
                                        <div className="row">
                                            <div className="col-md-3">
                                                <label className="form-label fw-semibold">
                                                    Inpatient Number
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Enter IP-000XXX"
                                                    value={inpatientNo}
                                                    onChange={handleInpatientChange}
                                                />
                                            </div>

                                            <div className="col-md-3">
                                                <label className="form-label fw-semibold">
                                                    Patient Name
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Enter Patient Name"
                                                    value={patientName}
                                                    onChange={handlePatientNameChange}
                                                />
                                            </div>

                                            <div className="col-md-3">
                                                <label className="form-label fw-semibold">
                                                    Request Number
                                                </label>
                                                <input
                                                    type="tel"
                                                    className="form-control"
                                                    placeholder="Enter Request Number"
                                                    value={mobileNumber}
                                                    onChange={handleMobileNumberChange}
                                                />
                                            </div>

                                            <div className="col-md-2 d-flex align-items-end">
                                                <button
                                                    type="button"
                                                    className="btn btn-success"
                                                    onClick={handleSearchClick}
                                                >
                                                    Search
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="table-responsive">
                                <table className="table table-bordered table-hover align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Request No</th>
                                            <th>Inpatient No</th>
                                            <th>Patient Name</th>
                                            <th>Blood Group</th>
                                            <th>Component</th>
                                            <th>Units</th>
                                            <th>Urgency</th>
                                            <th>Requested Date & Time</th>
                                            <th>Required By</th>
                                            <th>Tracking Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentItems.length > 0 ? (
                                            currentItems.map((request) => (
                                                <tr key={request.id}>
                                                    <td>
                                                        <span >{request.requestNo}</span>
                                                    </td>
                                                    <td>{request.inpatientNo}</td>
                                                    <td>{request.patientName}</td>
                                                    <td>
                                                            {request.bloodGroup}
                                                    </td>
                                                    <td>{request.component}</td>
                                                    <td className="text-center fw-bold">{request.units}</td>
                                                    <td>{getUrgencyBadge(request.urgency)}</td>
                                                    <td>{request.requestedDate}</td>
                                                    <td>
                                                        {request.requiredBy === "ASAP" ? 
                                                            "ASAP" :
                                                            request.requiredBy
                                                        }
                                                    </td>
                                                    <td>{getTrackingStatusBadge(request.trackingStatus)}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="10" className="text-center py-4">
                                                    <div className="text-muted">
                                                        <h6 className="mt-2">No blood requests found</h6>
                                                        <p className="mb-0">Try adjusting your search criteria</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {filteredRequests.length > 0 && (
                                <Pagination
                                    totalItems={filteredRequests.length}
                                    itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                                    currentPage={currentPage}
                                    onPageChange={setCurrentPage}
                                />
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

export default BloodRequestTracking;