import { useState, useEffect } from "react";
import Popup from "../../../Components/popup";
import { DG_MAS_INVESTIGATION_METHODOLOGY } from "../../../config/apiConfig";
import LoadingScreen from "../../../Components/Loading";
import { postRequest, putRequest, getRequest } from "../../../service/apiService";
import Pagination, { DEFAULT_ITEMS_PER_PAGE } from "../../../Components/Pagination";
import { ADD_INV_METHODOLOGY_SUCC_MSG, DUPLICATE_INV_METHODOLOGY, FAIL_TO_SAVE_CHANGES, FETCH_INV_METHODOLOGY_ERR_MSG, UPDATE_INV_METHODOLOGY_SUCC_MSG } from "../../../config/constants";

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
    const [isLoading, setIsLoading] = useState(true);

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
            showPopup(FETCH_INV_METHODOLOGY_ERR_MSG, "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const filteredMethodologies = methodologies.filter(
        (methodology) =>
            methodology.methodName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            methodology.note.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const indexOfLast = currentPage * DEFAULT_ITEMS_PER_PAGE;
    const indexOfFirst = indexOfLast - DEFAULT_ITEMS_PER_PAGE;
    const currentItems = filteredMethodologies.slice(indexOfFirst, indexOfLast);

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
                showPopup(DUPLICATE_INV_METHODOLOGY, "error");
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
                    showPopup(UPDATE_INV_METHODOLOGY_SUCC_MSG, "success");
                }
            } else {
                // Add new methodology
                const response = await postRequest(`${DG_MAS_INVESTIGATION_METHODOLOGY}/create`, {
                    methodName: formData.methodName,
                    note: formData.note,
                });
    
                if (response && response.status === 200) {
                    fetchMethodologies(); 
                    showPopup(ADD_INV_METHODOLOGY_SUCC_MSG, "success");
                }
            }
    
            
            setEditingMethodology(null);
            setFormData({ methodName: "", note: "" });
            setShowForm(false);
        } catch (err) {
            console.error("Error saving Investigation methodology:", err);
            showPopup(FAIL_TO_SAVE_CHANGES, "error");
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
    
    const handleRefresh = () => {
        setSearchQuery("");
        setCurrentPage(1);
        fetchMethodologies();
    };

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h4 className="card-title p-2">Investigation Methodology Master</h4>
                            <div className="d-flex justify-content-between align-items-center">
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
                                            <button 
                                                type="button" 
                                                className="btn btn-success me-2 flex-shrink-0" 
                                                onClick={handleRefresh}
                                            >
                                                <i className="mdi mdi-refresh"></i> Show All
                                            </button>
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
                                <>
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
                                                {currentItems.length > 0 ? (
                                                    currentItems.map((methodology) => (
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
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="3" className="text-center">
                                                            No methodologies found
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    
                                    {/* PAGINATION USING REUSABLE COMPONENT */}
                                    {filteredMethodologies.length > 0 && (
                                        <Pagination
                                            totalItems={filteredMethodologies.length}
                                            itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                                            currentPage={currentPage}
                                            onPageChange={setCurrentPage}
                                        />
                                    )}
                                </>
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