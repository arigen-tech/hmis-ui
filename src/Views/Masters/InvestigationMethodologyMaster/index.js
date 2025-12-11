import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import axios from "axios";
import { API_HOST, DG_MAS_INVESTIGATION_METHODOLOGY } from "../../../config/apiConfig";
import LoadingScreen from "../../../Components/Loading";
import { postRequest, putRequest, getRequest } from "../../../service/apiService";

const InvestigationMethodologyMaster = () => {
    const [methodologies, setMethodologies] = useState([]);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, methodologyId: null, newStatus: false });
    const [formData, setFormData] = useState({
        methodName: "",
        note: "",
    });
    const [searchQuery, setSearchQuery] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    const [editingMethodology, setEditingMethodology] = useState(null);
    const [popupMessage, setPopupMessage] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageInput, setPageInput] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const itemsPerPage = 5;

    const METHOD_NAME_MAX_LENGTH = 30;
    const NOTE_MAX_LENGTH = 50;

    
    useEffect(() => {
        fetchMethodologies();
    }, []);

    const fetchMethodologies = async () => {
        setIsLoading(true);
        try {
            const response = await getRequest(`${DG_MAS_INVESTIGATION_METHODOLOGY}/findAll`);
            if (response && response.response) {
                setMethodologies(response.response);
            }
        } catch (err) {
            console.error("Error fetching methodologies:", err);
            showPopup("Failed to load methodologies", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1); 
    };

    const filteredMethodologies = methodologies.filter(
        (methodology) =>
            methodology.methodName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            methodology.note.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredTotalPages = Math.ceil(filteredMethodologies.length / itemsPerPage);
    const currentItems = filteredMethodologies.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleEdit = (methodology) => {
        setEditingMethodology(methodology);
        setFormData({
            methodName: methodology.methodName,
            note: methodology.note,
        });
        setIsFormValid(true);
        setShowForm(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!isFormValid) return;
        
        setIsLoading(true);
        try {
            
            const isDuplicate = methodologies.some(
                (methodology) =>
                    methodology.methodId !== (editingMethodology ? editingMethodology.methodId : null) &&
                    (methodology.methodName === formData.methodName ||
                     methodology.note === formData.note)
            );
    
            if (isDuplicate) {
                showPopup("Investigation Methodology with the same name or note already exists!", "error");
                setIsLoading(false);
                return;
            }
    
            if (editingMethodology) {
                
                const response = await putRequest(`${DG_MAS_INVESTIGATION_METHODOLOGY}/update/${editingMethodology.methodId}`, {
                    methodName: formData.methodName,
                    note: formData.note,
                });
    
                if (response && response.status === 200) {
                    fetchMethodologies(); 
                    showPopup("Investigation Methodology updated successfully!", "success");
                }
            } else {
                // Add new methodology
                const response = await postRequest(`${DG_MAS_INVESTIGATION_METHODOLOGY}/create`, {
                    methodName: formData.methodName,
                    note: formData.note,
                });
    
                if (response && response.status === 200) {
                    fetchMethodologies(); 
                    showPopup("New methodology added successfully!", "success");
                }
            }
    
            
            setEditingMethodology(null);
            setFormData({ methodName: "", note: "" });
            setShowForm(false);
        } catch (err) {
            console.error("Error saving Investigation methodology:", err);
            showPopup(`Failed to save changes: ${err.response?.data?.message || err.message}`, "error");
            setIsLoading(false);
        }
    };
    

    const showPopup = (message, type = "info") => {
        setPopupMessage({
            message,
            type,
            onClose: () => {
                setPopupMessage(null);
            },
        });
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData((prevData) => {
            const updatedData = { ...prevData, [id]: value };
            setIsFormValid(
                updatedData.methodName.trim() !== "" &&
                updatedData.note.trim() !== ""
            );
            return updatedData;
        });
    };
    
    const handlePageNavigation = () => {
        const pageNumber = parseInt(pageInput, 10);
        if (pageNumber > 0 && pageNumber <= filteredTotalPages) {
            setCurrentPage(pageNumber);
        } else {
            alert("Please enter a valid page number.");
        }
    };

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header">
                            <h4 className="card-title p-2">Investigation Methodology Master</h4>
                            <div className="d-flex justify-content-between align-items-center mt-3">
                                {!showForm && (
                                    <form className="d-inline-block searchform me-4" role="search">
                                        <div className="input-group searchinput">
                                            <input
                                                type="search"
                                                className="form-control"
                                                placeholder="Search"
                                                aria-label="Search"
                                                value={searchQuery}
                                                onChange={handleSearchChange}
                                            />
                                            <span className="input-group-text" id="search-icon">
                                                <i className="fa fa-search"></i>
                                            </span>
                                        </div>
                                    </form>
                                )}
                                <div className="d-flex align-items-center ms-auto">
                                    {!showForm ? (
                                        <>
                                            <button type="button" className="btn btn-success me-2" onClick={() => setShowForm(true)}>
                                                <i className="mdi mdi-plus"></i> Add
                                            </button>
                                            {/* <button type="button" className="btn btn-success me-2 flex-shrink-0">
                                                <i className="mdi mdi-plus"></i> Generate Report
                                            </button> */}
                                        </>
                                    ) : (
                                        <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                                            <i className="mdi mdi-arrow-left"></i> Back
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="card-body">
                            {!showForm ? (
                                <div className="table-responsive packagelist">
                                    <table className="table table-bordered table-hover align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Method Name</th>
                                                <th>Note</th>
                                                <th>Edit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentItems.map((methodology) => (
                                                <tr key={methodology.methodId}>
                                                    <td>{methodology.methodName}</td>
                                                    <td>{methodology.note}</td>
                                                    <td>
                                                        <button
                                                            className="btn btn-sm btn-success me-2"
                                                            onClick={() => handleEdit(methodology)}
                                                        >
                                                            <i className="fa fa-pencil"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <nav className="d-flex justify-content-between align-items-center mt-3">
                                        <div>
                                            <span>
                                                Page {currentPage} of {filteredTotalPages} | Total Records: {filteredMethodologies.length}
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
                                            {[...Array(filteredTotalPages)].map((_, index) => (
                                                <li
                                                    className={`page-item ${currentPage === index + 1 ? "active" : ""}`}
                                                    key={index}
                                                >
                                                    <button className="page-link" onClick={() => setCurrentPage(index + 1)}>
                                                        {index + 1}
                                                    </button>
                                                </li>
                                            ))}
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
                            ) : (
                                <form className="forms row" onSubmit={handleSave}>
                                    <div className="form-group col-md-4 mt-3">
                                        <label>Method Name <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="methodName"
                                            placeholder="Method Name"
                                            value={formData.methodName}
                                            onChange={handleInputChange}
                                            maxLength={METHOD_NAME_MAX_LENGTH}
                                            required
                                        />
                                    </div>
                                    <div className="form-group col-md-4 mt-3">
                                        <label>Note <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="note"
                                            placeholder="Note"
                                            value={formData.note}
                                            onChange={handleInputChange}
                                            maxLength={NOTE_MAX_LENGTH}
                                            required
                                        />
                                    </div>
                                    
                                    <div className="form-group col-md-12 d-flex justify-content-end mt-2">
                                        <button type="submit" className="btn btn-primary me-2" disabled={!isFormValid}>
                                            Save
                                        </button>
                                        <button type="button" className="btn btn-danger" onClick={() => setShowForm(false)}>
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}
                            {popupMessage && (
                                <Popup
                                    message={popupMessage.message}
                                    type={popupMessage.type}
                                    onClose={popupMessage.onClose}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvestigationMethodologyMaster;