import React, { useState } from "react";
import Popup from "../../../Components/popup";

const Assignapplication = () => {
    const [showForm, setShowForm] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = 3;
    const totalProducts = 12;
    const [popupMessage, setPopupMessage] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [showModuleSection, setShowModuleSection] = useState(false);
    const [selectedModule, setSelectedModule] = useState('');
    const [showModuleTable, setShowModuleTable] = useState(false);
    const [templateData, setTemplateData] = useState([]);
    const [moduleData, setModuleData] = useState([]);

    const handleEditClick = () => {
        setIsEditMode(!isEditMode); // Toggle edit mode
    };

    const handleTemplateSelect = (e) => {
        const selectedTemplate = e.target.value;
        // Populate templateData based on selected template
        switch (selectedTemplate) {
            case "anm":
                setTemplateData([{ srNo: 1, module: "Admin" }]);
                break;
            case "apm":
                setTemplateData([{ srNo: 1, module: "Dispensary" }]);
                break;
            case "auditor":
                setTemplateData([{ srNo: 1, module: "Dashboard" }]);
                break;
            // Add cases for other templates as needed
            default:
                setTemplateData([]);
        }
    };

    const handleModuleSelect = (e) => {
        const selectedModule = e.target.value;
        setSelectedModule(selectedModule);
        // Populate moduleData based on selected module
        switch (selectedModule) {
            case "admin":
                setModuleData([
                    { srNo: 1, feature: "Feature A", checked: true },
                    { srNo: 2, feature: "Feature B", checked: false },
                ]);
                break;
            case "dispensary":
                setModuleData([
                    { srNo: 1, feature: "Feature C", checked: false },
                    { srNo: 2, feature: "Feature D", checked: true },
                ]);
                break;
            case "dashboard":
                setModuleData([
                    { srNo: 1, feature: "Feature E", checked: true },
                    { srNo: 2, feature: "Feature F", checked: false },
                ]);
                break;
            default:
                setModuleData([]);
        }
        setShowModuleTable(true);
    };

    const handleAddClick = () => {
        if (!document.getElementById("templateSelect").value) {
            setPopupMessage({ message: "You must select an option.", type: "warning", onClose: () => setPopupMessage(null) });
            setShowModal(true);
            return;
        }
        setShowModuleSection(true);
        setPopupMessage(null);
        setShowModal(false);
    };

    const handlePrevious = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    return (
        <div className="content-wrapper">
            <div className="row">
                <div className="col-12 grid-margin stretch-card">
                    <div className="card form-card">
                        <div className="card-body">
                            <form className="forms row">
                                <h5 className="bg-light p-3 rounded">Assign Application To Template</h5>
                                <div className="row mt-4">
                                    <div className="form-group col-md-2 mt-2">
                                        <label>Template Name</label>
                                    </div>
                                    <div className="form-group col-md-4 mt-1">
                                        <select
                                            className="form-control"
                                            id="templateSelect"
                                            required
                                            onChange={handleTemplateSelect}
                                        >
                                            <option value="" selected disabled>Select Template</option>
                                            <option value="anm">ANM</option>
                                            <option value="apm">APM</option>
                                            <option value="auditor">AUDITOR</option>
                                            <option value="city_officer">CITY OFFICER</option>
                                            <option value="cmo_template">CMO TEMPLATE</option>
                                            <option value="commissioner_template">COMMISSIONER TEMPLATE</option>
                                            <option value="district_officer">DISTRICT OFFICER</option>
                                        </select>
                                    </div>
                                    <div className="form-group col-md-4 mt-1">
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            onClick={handleAddClick}
                                        >
                                            Application
                                        </button>
                                    </div>
                                </div>

                                {showModuleSection && (
                                    <div className="row mt-1">
                                        <div className="form-group col-md-2 mt-2">
                                            <label>Module Name</label>
                                        </div>
                                        <div className="form-group col-md-4 mt-1">
                                            <select
                                                className="form-control"
                                                id="moduleSelect"
                                                required
                                                onChange={handleModuleSelect}
                                                value={selectedModule}
                                            >
                                                <option value="" disabled>Select Module</option>
                                                <option value="admin">Admin</option>
                                                <option value="dispensary">Dispensary</option>
                                                <option value="dashboard">Dashboard</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-4">
                                    <table className="mt-3 table table-bordered table-hover align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Sr No</th>
                                                <th>Assigned Module</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {templateData.map((item) => (
                                                <tr key={item.srNo}>
                                                    <td>{item.srNo}</td>
                                                    <td>{item.module}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {showModuleTable && (
                                    <div className="mt-1">
                                        <table className="mt-3 table table-bordered table-hover align-middle">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Sr No</th>
                                                    <th>Assigned Module</th>
                                                    <th>
                                                        <label className="form-check-label">
                                                            <input  type="checkbox"
                                                            style={{width:"15px", height:'15px',border:'2px solid black'}}
                                                            className="form-check-input me-2" />
                                                        </label>
                                                        Select All
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {moduleData.map((item) => (
                                                    <tr key={item.srNo}>
                                                        <td>{item.srNo}</td>
                                                        <td>{item.feature}</td>
                                                        <td>
                                                            <div className="form-check form-check-muted m-0">
                                                                <label className="form-check-label">
                                                                    <input type="checkbox"
                                                                    style={{ width: '20px', height: '20px', border: '2px solid black' }} 
                                                                     className="form-check-input" checked={item.checked} 
                                                                     onChange={() => {
                                                                        setModuleData(prevData => 
                                                                            prevData.map(mod => 
                                                                                mod.srNo === item.srNo ? { ...mod, checked: !mod.checked } : mod
                                                                            )
                                                                        );
                                                                    }} />
                                                                </label>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                    {showModal && popupMessage && (
                        <Popup
                            message={popupMessage.message}
                            type={popupMessage.type}
                            onClose={popupMessage.onClose}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default Assignapplication;
