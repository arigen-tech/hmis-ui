import { useState } from "react"
import Popup from "../../../Components/popup";


const Templatemaster = () => {

    const [templateData, setTemplateData] = useState([
        { id: 1, templateCode: "AST", templateName: "ACCOUNT SECTION TEMPLATE", status: "y" },
        { id: 2, templateCode: "ADM", templateName: "ADMIN", status: "n" },
        { id: 3, templateCode: "ANM", templateName: "ANM", status: "y" },
        { id: 4, templateCode: "APM", templateName: "APM", status: "y" },
    ]);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, applicationId: null, newStatus: false });

    const [formData, setFormData] = useState({
        templateCode: "",
        templateName: "",
    })
    const [searchQuery, setSearchQuery] = useState("");
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };
    const filteredTemplateData = templateData.filter(template =>
        template.templateCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.templateName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleTemplateEdit = (template) => {
        setEditingTemplate(template);
        setShowForm(true);
    };

    const handleTemplateSave = (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        const formElement = e.target;
        const updatedTemplateName = formElement.templateName.value;

        if (editingTemplate) {
            setTemplateData(templateData.map(template =>
                template.id === editingTemplate.id
                    ? { ...template, templateName: updatedTemplateName }
                    : template
            ));
        } else {
            const newTemplate = {
                id: templateData.length + 1,
                templateCode: formData.templateCode,
                templateName: updatedTemplateName,
                status: "y"
            };
            setTemplateData([...templateData, newTemplate]);
        }

        setEditingTemplate(null);
        setShowForm(false);
        showPopup("Changes saved successfully!", "success");
    };
    const [showForm, setShowForm] = useState(false)
    const [isFormValid, setIsFormValid] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [popupMessage, setPopupMessage] = useState(null);

    const showPopup = (message, type = 'info') => {
        setPopupMessage({
            message,
            type,
            onClose: () => {
                setPopupMessage(null);
            }
        });
    };



    const handleSwitchChange = (id, newStatus) => {
        setConfirmDialog({ isOpen: true, applicationId: id, newStatus });

    };
    const handleConfirm = (confirmed) => {
        if (confirmed && confirmDialog.applicationId !== null) {
            setTemplateData((prevData) =>
                prevData.map((template) =>
                    template.id === confirmDialog.applicationId ? { ...template, status: confirmDialog.newStatus } : template
                )
            );
        }
        setConfirmDialog({ isOpen: false, applicationId: null, newStatus: null });
    };
    const [currentPage, setCurrentPage] = useState(1);
    const [filteredTotalPages, setFilteredTotalPages] = useState(1);
    const [totalFilteredProducts, setTotalFilteredProducts] = useState(0);

    const handleInputChange = (e) => {
        const { id, value } = e.target
        setFormData((prevData) => ({ ...prevData, [id]: value }))
    }

    const handleCreateFormSubmit = (e) => {
        e.preventDefault()
        if (formData.templateCode && formData.templateName) {
            setTemplateData([...templateData, { ...formData, id: Date.now(), status: "y" }])
            setFormData({ templateCode: "", templateName: "" })
            setShowForm(false)
        } else {
            alert("Please fill out all required fields.")
        }
    }

    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h4 className="card-title p-2">Template Master</h4>
                            <div className="d-flex justify-content-between align-items-center">
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

                                <div className="d-flex align-items-center">
                                    {!showForm ? (

                                        <button type="button" className="btn btn-success me-2">
                                            <i className="mdi mdi-plus"></i> Show All
                                        </button>


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
                                                <th>Template Code</th>
                                                <th>Template Name</th>
                                                <th>Status</th>
                                                <th>Edit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredTemplateData.map((template) => (
                                                <tr key={template.id}>
                                                    <td>{template.templateCode}</td>
                                                    <td>{template.templateName}</td>
                                                    <td>
                                                        <div className="form-check form-switch">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                checked={template.status === "y"}
                                                                onChange={() => handleSwitchChange(template.id, template.status === "y" ? "n" : "y")}
                                                                id={`switch-${template.id}`}
                                                            />
                                                            <label
                                                                className="form-check-label px-0"
                                                                htmlFor={`switch-${template.id}`}
                                                            >
                                                                {template.status === "y" ? 'Active' : 'Inactive'}
                                                            </label>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="btn btn-sm btn-success me-2"
                                                            onClick={() => handleTemplateEdit(template)}
                                                            disabled={template.status !== "y"}
                                                        >
                                                            <i className="fa fa-pencil"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                      
                                    </table>
                                    <div className="row">
                          <div className="form-group col-md-4 mt-3"> 
                                <label>Template Code

                                    <span className="text-danger">*</span></label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="Template Code"
                                    placeholder="Template Code"
                                    required
                                />
                            </div>
                            <div className="form-group col-md-4 mt-3">
                                <label>Template Name <span className="text-danger">*</span></label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="Name"
                                    placeholder="Template Name"
                                    required
                                />
                            </div>
                          </div>
                                    <nav className="d-flex justify-content-between align-items-center mt-3">
                                        <div>
                                            <span>
                                                Page {currentPage} of {filteredTotalPages} | Total Records: {totalFilteredProducts}
                                            </span>
                                        </div>
                                        <ul className="pagination mb-0">
                                            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                                                <button className="page-link" disabled>
                                                    &laquo;
                                                </button>
                                            </li>
                                            {[...Array(filteredTotalPages)].map((_, index) => (
                                                <li
                                                    className={`page-item ${currentPage === index + 1 ? "active" : ""}`}
                                                    key={index}
                                                >
                                                    <button className="page-link" disabled>
                                                        {index + 1}
                                                    </button>
                                                </li>
                                            ))}
                                            <li className={`page-item ${currentPage === filteredTotalPages ? "disabled" : ""}`}>
                                                <button className="page-link" disabled>
                                                    &raquo;
                                                </button>
                                            </li>
                                        </ul>
                                    </nav>
                                </div>

                            ) : (
                                <form className="forms row" onSubmit={handleTemplateSave}>
                                    <div className="form-group col-md-6">
                                        <label>Template Code <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="templateCode"
                                            name="templateCode"
                                            placeholder="Template Code"
                                            defaultValue={editingTemplate ? editingTemplate.templateCode : ""}
                                            onChange={(e) => setIsFormValid(e.target.value.trim() !== "")}
                                            required
                                        />
                                    </div>
                                    <div className="form-group col-md-6">
                                        <label>Template Name <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="templateName"
                                            name="templateName"
                                            placeholder="Template Name"
                                            defaultValue={editingTemplate ? editingTemplate.templateName : ""}
                                            required
                                        />
                                    </div>
                                    <div className="form-group col-md-12 d-flex justify-content-end">
                                        <button type="submit" className="btn btn-primary me-2" disabled={!isFormValid}>
                                            Save
                                        </button>
                                        <button type="button" className="btn btn-danger" onClick={() => setShowForm(false)}>
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}
                            {showModal && (
                                <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
                                    <div className="modal-dialog">
                                        <div className="modal-content">
                                            <div className="modal-header">
                                                <h1 className="modal-title fs-5" id="staticBackdropLabel">Modal title</h1>
                                                <button type="button" className="btn-close" onClick={() => setShowModal(false)} aria-label="Close"></button>
                                            </div>
                                            <div className="modal-body">

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
                                                    Are you sure you want to {confirmDialog.newStatus === "y" ? 'activate' : 'deactivate'} <strong>{templateData.find(template => template.id === confirmDialog.applicationId)?.templateName}</strong>?
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
                            {!showForm && (
                                <div className="d-flex justify-content-end mt-4">
                                    <button type="button" className="btn btn-success me-2" onClick={() => setShowForm(true)}>
                                        <i className="mdi mdi-plus"></i> Add
                                    </button>
                                    <button type="button" className="btn btn-warning" onClick={() => {
                                        setFormData({ applicationCode: "", applicationName: "" });
                                        setShowForm(false);
                                    }}>
                                        <i className="mdi mdi-refresh"></i> Reset
                                    </button>
                                </div>
                            )

                            }


                         
                            
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Templatemaster;

