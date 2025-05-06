import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import {
    DEPARTMENT,
    EMPLOYEE_REGISTRATION,
} from "../../../config/apiConfig";
import { getRequest, putRequest } from "../../../service/apiService";
import LoadingScreen from "../../../Components/Loading/index";


const Approveemployee = () => {
    const [departmentData, setDepartmentData] = useState([]);
    const [employeeData, setEmployeeData] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [popupMessage, setPopupMessage] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [pageInput, setPageInput] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const [loading, setLoading] = useState(false);

    const [selectedDepartments, setSelectedDepartments] = useState({});
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        employeeId: null,
        departmentId: null,
    });



    const fetchDepartmentData = async () => {
        setLoading(true);
        try {
            const data = await getRequest(`${DEPARTMENT}/getAllDepartments/1`);
            if (data.status === 200 && Array.isArray(data.response)) {
                setDepartmentData(data.response);
            } else {
                setDepartmentData([]);
            }
        } catch (error) {
            console.error("Error fetching Department data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployeeData = async () => {
        setLoading(true);
        try {
            const data = await getRequest(`/${EMPLOYEE_REGISTRATION}/status/S`);
            if (data.status === 200 && Array.isArray(data.response)) {
                const cleanedEmployees = data.response.map((emp) => ({
                    ...emp,
                    department: emp.department?.id
                        ? {
                            id: emp.department.id,
                            departmentName: emp.department.departmentName,
                        }
                        : null,
                }));
                setEmployeeData(cleanedEmployees);

                // Initialize the selectedDepartments object with current values
                const initialDeptSelections = {};
                cleanedEmployees.forEach(emp => {
                    if (emp.department?.id) {
                        initialDeptSelections[emp.id] = emp.department.id;
                    }
                });
                setSelectedDepartments(initialDeptSelections);
            } else {
                setEmployeeData([]);
            }
        } catch (error) {
            console.error("Error fetching Employee data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployeeData();
        fetchDepartmentData();
    }, []);

    const handleDepartmentChange = (employeeId, departmentId) => {
        setSelectedDepartments({
            ...selectedDepartments,
            [employeeId]: departmentId
        });
    };

    const openConfirmDialog = (employeeId, departmentId) => {
        setConfirmDialog({
            isOpen: true,
            employeeId,
            departmentId
        });
    };

    const handleConfirm = async (confirmed) => {
        if (confirmed) {
            await approveEmployee(confirmDialog.employeeId, confirmDialog.departmentId);
        }

        setConfirmDialog({
            isOpen: false,
            employeeId: null,
            departmentId: null
        });
    };

    const approveEmployee = async (employeeId, departmentId) => {
        setLoading(true);
        try {
            const response = await putRequest(`${EMPLOYEE_REGISTRATION}/approve/${employeeId}/${departmentId}`);

            if (response.status === 200) {
                showPopup("Employee approved successfully", "success");
                fetchEmployeeData();
            } else {
                showPopup("Failed to approve employee: " + (response.message || "Unknown error"), "error");
            }
        } catch (error) {
            console.error("Error approving employee:", error);
            showPopup("Error approving employee: " + (error.message || "Unknown error"), "error");
        } finally {
            setLoading(false);
        }
    };

    const filteredEmployees = employeeData.filter((employee) =>
        `${employee.firstName} ${employee.middleName} ${employee.lastName} ${employee.mobileNo}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
    );

    const currentItems = filteredEmployees.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const filteredTotalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

    const showPopup = (message, type = "info") => {
        setPopupMessage({
            message,
            type,
            onClose: () => setPopupMessage(null),
        });
    };

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const handlePageNavigation = () => {
        const pageNumber = parseInt(pageInput, 10);
        if (pageNumber > 0 && pageNumber <= filteredTotalPages) {
            setCurrentPage(pageNumber);
        } else {
            alert("Please enter a valid page number.");
        }
    };

    const renderPagination = () => {
        const pageNumbers = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        const endPage = Math.min(filteredTotalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        if (startPage > 1) {
            pageNumbers.push(1);
            if (startPage > 2) pageNumbers.push("...");
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        if (endPage < filteredTotalPages) {
            if (endPage < filteredTotalPages - 1) pageNumbers.push("...");
            pageNumbers.push(filteredTotalPages);
        }

        return pageNumbers.map((number, index) => (
            <li key={index} className={`page-item ${number === currentPage ? "active" : ""}`}>
                {typeof number === "number" ? (
                    <button className="page-link" onClick={() => setCurrentPage(number)}>
                        {number}
                    </button>
                ) : (
                    <span className="page-link disabled">{number}</span>
                )}
            </li>
        ));
    };

    const getDepartmentName = (deptId) => {
        const dept = departmentData.find(d => d.id === deptId);
        return dept ? dept.departmentName : "";
    };

    return (
        <div className="content-wrapper">
            {loading && <LoadingScreen />}
            {popupMessage && (
                <Popup
                    message={popupMessage.message}
                    type={popupMessage.type}
                    onClose={popupMessage.onClose}
                />
            )}

            <div className="card form-card">
                <div className="card-header d-flex justify-content-between align-items-center">
                    <h4 className="card-title">Pending for Approval</h4>
                    <form className="d-inline-block searchform me-4" role="search">
                        <div className="input-group searchinput">
                            <input
                                type="search"
                                className="form-control"
                                placeholder="Search Employees"
                                value={searchQuery}
                                onChange={handleSearch}
                            />
                            <span className="input-group-text">
                                <i className="fa fa-search"></i>
                            </span>
                        </div>
                    </form>
                </div>

                <div className="card-body">
                    <div className="table-responsive packagelist">
                        <table className="table table-bordered table-hover align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th>Employee Name</th>
                                    <th>Mobile No.</th>
                                    <th>Department</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.map((employee) => (
                                    <tr key={employee.employeeId}>
                                        <td>
                                            {employee.firstName} {employee.middleName} {employee.lastName}
                                        </td>
                                        <td>{employee.mobileNo}</td>
                                        <td>
                                            <select
                                                className="form-select"
                                                value={selectedDepartments[employee.employeeId] || ""}
                                                onChange={(e) => handleDepartmentChange(employee.employeeId, e.target.value)}
                                                required
                                            >
                                                <option value="" disabled>Select Department</option>
                                                {departmentData.map((dept) => (
                                                    <option key={dept.id} value={dept.id}>
                                                        {dept.departmentName}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-warning"
                                                disabled={!selectedDepartments[employee.employeeId]}
                                                onClick={() => openConfirmDialog(employee.employeeId, selectedDepartments[employee.employeeId])}
                                            >
                                                <i className="mdi mdi-check"></i> Approve
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredEmployees.length === 0 && (
                            <div className="text-center py-4">No employees found</div>
                        )}

                        <nav className="d-flex justify-content-between align-items-center mt-3">
                            <span>
                                Page {currentPage} of {filteredTotalPages} | Total Records:{" "}
                                {filteredEmployees.length}
                            </span>
                            <ul className="pagination mb-0">
                                <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => setCurrentPage(currentPage - 1)}
                                        disabled={currentPage === 1}
                                    >
                                        &laquo; Previous
                                    </button>
                                </li>
                                {renderPagination()}
                                <li
                                    className={`page-item ${currentPage === filteredTotalPages ? "disabled" : ""}`}
                                >
                                    <button
                                        className="page-link"
                                        onClick={() => setCurrentPage(currentPage + 1)}
                                        disabled={currentPage === filteredTotalPages}
                                    >
                                        Next &raquo;
                                    </button>
                                </li>
                            </ul>
                            <div className="d-flex align-items-center">
                                <input
                                    type="number"
                                    min="1"
                                    max={filteredTotalPages}
                                    value={pageInput}
                                    onChange={(e) => setPageInput(e.target.value)}
                                    placeholder="Go to page"
                                    className="form-control me-2"
                                    style={{ width: "100px" }}
                                />
                                <button className="btn btn-primary" onClick={handlePageNavigation}>
                                    Go
                                </button>
                            </div>
                        </nav>
                    </div>



                    {confirmDialog.isOpen && (
                        <div className="modal d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                            <div className="modal-dialog" role="document">
                                <div className="modal-content">
                                    <div className="modal-header">
                                        <h5 className="modal-title">Confirm Approval</h5>
                                        <button
                                            type="button"
                                            className="close"
                                            onClick={() => handleConfirm(false)}
                                        >
                                            <span>&times;</span>
                                        </button>
                                    </div>
                                    <div className="modal-body">
                                        <p>
                                            Are you sure you want to approve{" "}
                                            <strong>
                                                {
                                                    employeeData.find(
                                                        (emp) => emp.id === confirmDialog.employeeId
                                                    )?.firstName
                                                }{" "}
                                                {
                                                    employeeData.find(
                                                        (emp) => emp.id === confirmDialog.employeeId
                                                    )?.lastName
                                                }
                                            </strong>
                                            {" "} with department{" "}
                                            <strong>
                                                {getDepartmentName(confirmDialog.departmentId)}
                                            </strong>
                                            ?
                                        </p>
                                    </div>
                                    <div className="modal-footer">
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={() => handleConfirm(false)}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            onClick={() => handleConfirm(true)}
                                        >
                                            Confirm
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Approveemployee;