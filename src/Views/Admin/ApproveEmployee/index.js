import { useState, useEffect } from "react"
import Popup from "../../../Components/popup";

const Approveemployee = () => {
 
    const [showModal, setShowModal] = useState(false);
    const [popupMessage, setPopupMessage] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [pageInput, setPageInput] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const departmentOptions = [
        "HR",
        "IT",
        "Finance",
        "Marketing",
        "Operations",
        "Sales"
    ];


    const [employeeData, setEmployeeData] = useState([
        { id: 1, employeeName: "John Doe", email: "john@example.com", department: "HR", status: "n" },
        { id: 2, employeeName: "Jane Smith", email: "jane@example.com", department: "IT", status: "n" },
        { id: 2, employeeName: "Jane Smith", email: "jane@example.com", department: "IT", status: "n" },
        { id: 2, employeeName: "Jane Smith", email: "jane@example.com", department: "IT", status: "n" },

    ]);

    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, employeeId: null, newStatus: false });
    const [totalFilteredProducts, setTotalFilteredProducts] = useState(0);

    const filteredEmployees = employeeData.filter(employee =>
        employee.employeeName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1); // Reset to first page when search changes
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



   

    const handleActivate = (id) => {
        setConfirmDialog({ isOpen: true, employeeId: id, newStatus: "y" });
    };

    const handleDepartmentChange = (employeeId, newDepartment) => {
        setEmployeeData(prevData =>
            prevData.map(employee =>
                employee.id === employeeId ? { ...employee, department: newDepartment } : employee
            )
        );
    };

    const handleConfirm = (confirmed) => {
        if (confirmed && confirmDialog.employeeId !== null) {
            setEmployeeData(prevData =>
                prevData.map(employee =>
                    employee.id === confirmDialog.employeeId ? { ...employee, status: confirmDialog.newStatus } : employee
                )
            );
            showPopup("Employee activated successfully!", "success");
        }
        setConfirmDialog({ isOpen: false, employeeId: null, newStatus: null });
    };

    const filteredTotalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

    const currentItems = filteredEmployees.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

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

    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h4 className="card-title">Approve Employee</h4>
                            <div className="d-flex justify-content-between align-items-center">
                                    <form className="d-inline-block searchform me-4" role="search">
                                        <div className="input-group searchinput">
                                            <input
                                                type="search"
                                                className="form-control"
                                                placeholder="Search Employees"
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
                                <div className="table-responsive packagelist">
                                    <table className="table table-bordered table-hover align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Employee Name</th>
                                                <th>Email</th>
                                                <th>Department</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentItems.map(employee => (
                                                <tr key={employee.id}>
                                                    <td>{employee.employeeName}</td>
                                                    <td>{employee.email}</td>
                                                    <td>
                                                        <select
                                                            className="form-control"
                                                            value={employee.department}
                                                            onChange={(e) => handleDepartmentChange(employee.id, e.target.value)}
                                                        >
                                                            <option value="">Select Department</option>
                                                            {departmentOptions.map((dept, index) => (
                                                                <option key={index} value={dept}>
                                                                    {dept}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <button
                                                            type="button"
                                                            className="btn btn-warning me-2"
                                                            onClick={() => handleActivate(employee.id)}
                                                            disabled={employee.status === "y"}
                                                        >
                                                            <i className="mdi mdi-check"></i> {employee.status === "y" ? "Activated" : "Activate"}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <nav className="d-flex justify-content-between align-items-center mt-3">
                                        <div>
                                            <span>
                                                Page {currentPage} of {filteredTotalPages} | Total Records: {filteredEmployees.length}
                                            </span>
                                        </div>
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
                                            <li className={`page-item ${currentPage === filteredTotalPages ? "disabled" : ""}`}>
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
                                            />
                                            <button
                                                className="btn btn-primary"
                                                onClick={handlePageNavigation}
                                            >
                                                Go
                                            </button>
                                        </div>
                                    </nav>
                                </div>
                            
                            {showModal && (
                                <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
                                    <div className="modal-dialog">
                                        <div className="modal-content">
                                            <div className="modal-header">
                                                <h1 className="modal-title fs-5" id="staticBackdropLabel">Modal title</h1>
                                                <button type="button" className="btn-close" onClick={() => setShowModal(false)} aria-label="Close"></button>
                                            </div>
                                            <div className="modal-body">
                                                {/* Your modal content goes here */}
                                                ...
                                            </div>
                                            <div className="modal-footer">
                                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button>
                                                <button type="button" className="btn btn-primary">Understood</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {popupMessage && (
                                <Popup
                                    message={popupMessage.message}
                                    type={popupMessage.type}
                                    onClose={popupMessage.onClose}
                                />
                            )}
                            {confirmDialog.isOpen && (
                                <div className="modal d-block" tabIndex="-1" role="dialog">
                                    <div className="modal-dialog" role="document">
                                        <div className="modal-content">
                                            <div className="modal-header">
                                                <h5 className="modal-title">Confirm Status Change</h5>
                                                <button type="button" className="close" onClick={() => handleConfirm(false)}>
                                                    <span>&times;</span>
                                                </button>
                                            </div>
                                            <div className="modal-body">
                                                <p>
                                                    Are you sure you want to activate <strong>{employeeData.find(employee => employee.id === confirmDialog.employeeId)?.employeeName}</strong>?
                                                </p>
                                            </div>
                                            <div className="modal-footer">
                                                <button type="button" className="btn btn-secondary" onClick={() => handleConfirm(false)}>No</button>
                                                <button type="button" className="btn btn-primary" onClick={() => handleConfirm(true)}>Yes</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Approveemployee;