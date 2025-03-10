import React, { useState } from "react";
import Popup from "../../../Components/popup";


const Rolesrights = () => {
    const [showForm, setShowForm] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = 3;
    const totalProducts = 12;
    const [popupMessage, setPopupMessage] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);




    const handleEditClick = () => {
        setIsEditMode(!isEditMode); // Toggle edit mode
    };

    const roleCheckboxMapping = {
        admin: ["ADMIN", "ANM"],
        anm: ["APM", "AUDIT", "AUDITOR"],
        // Add more mappings as needed
    };
    
    const handleAddClick = () => {
        const selectedRole = document.getElementById("templateSelect").value;
        const checkboxesToCheck = roleCheckboxMapping[selectedRole] || [];
    
        // Reset all checkboxes
        const checkboxes = document.querySelectorAll(".form-check-input");
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
    
        // Check the relevant checkboxes
        checkboxesToCheck.forEach(role => {
            const checkbox = Array.from(checkboxes).find(cb => cb.closest("tr").firstChild.textContent === role);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
    }



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

                                <h5 className="bg-light p-3 rounded">Role Rights</h5>


                                <div className="row mt-3">
                                    <div className="col-md-2">
                                        <label>Select Role</label>
                                    </div>
                                    <div className="col-md-4">
                                        <select
                                            className="form-control"
                                            id="templateSelect"
                                            onChange={handleAddClick}
                                            required
                                        >
                                            <option value="" disabled>Select Template</option>
                                            <option value="admin">ADMIN</option>
                                            <option value="anm">ANM</option>
                                            <option value="apm">APM</option>
                                            <option value="audit">AUDIT</option>
                                            <option value="auditor">AUDITOR</option>
                                            <option value="city_officer">CITY OFFICER</option>
                                            <option value="cmho">CMHO</option>
                                            <option value="cmo">CMO</option>
                                            <option value="commissioner">COMMISSIONER</option>
                                            <option value="district_officer">DISTRICT OFFICER</option>
                                            <option value="doctor">Doctor</option>
                                            <option value="driver">DRIVER</option>
                                            <option value="lab_tech">Lab Tech</option>
                                            <option value="nodal_officer">NODAL OFFICER</option>
                                            <option value="payment_officer">PAYMENT OFFICER</option>
                                            <option value="pharmacist">PHARMACIST</option>
                                            <option value="sr_auditor">SR. AUDITOR</option>
                                            <option value="senior_auditor">SENIOR AUDITOR</option>
                                            <option value="state_officer">STATE OFFICER</option>
                                            <option value="sub_commissioner">SUB COMMISSIONER</option>
                                            <option value="sub_nodal_officer">SUB NODAL OFFICER</option>
                                            <option value="super_admin">SUPER ADMIN</option>
                                            <option value="super_user">SUPER USER</option>
                                            <option value="upss">UPSS</option>
                                            <option value="upss_officer">UPSS OFFICER</option>
                                            <option value="vendor">VENDOR</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                    <table className="mt-3 table table-bordered table-hover align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th colSpan="2">Templates</th>
                                            </tr>
                                        </thead>
                                        <tbody>
    <tr>
        <td>ADMIN</td>
        <td>
            <div className="form-check form-check-muted m-0">
                <label className="form-check-label">
                    <input type="checkbox" style={{ width: '20px', height: '20px', border: '2px solid black' }} className="form-check-input" />
                </label>
            </div>
        </td>
    </tr>
    <tr>
        <td>ANM</td>
        <td>
            <div className="form-check form-check-muted m-0">
                <label className="form-check-label">
                    <input type="checkbox" style={{ width: '20px', height: '20px', border: '2px solid black' }} className="form-check-input" />
                </label>
            </div>
        </td>
    </tr>
    <tr>
        <td>APM</td>
        <td>
            <div className="form-check form-check-muted m-0">
                <label className="form-check-label">
                    <input type="checkbox" style={{ width: '20px', height: '20px', border: '2px solid black' }} className="form-check-input" />
                </label>
            </div>
        </td>
    </tr>
    <tr>
        <td>AUDIT</td>
        <td>
            <div className="form-check form-check-muted m-0">
                <label className="form-check-label">
                    <input type="checkbox" style={{ width: '20px', height: '20px', border: '2px solid black' }} className="form-check-input" />
                </label>
            </div>
        </td>
    </tr>
    <tr>
        <td>AUDITOR</td>
        <td>
            <div className="form-check form-check-muted m-0">
                <label className="form-check-label">
                    <input type="checkbox" style={{ width: '20px', height: '20px', border: '2px solid black' }} className="form-check-input" />
                </label>
            </div>
        </td>
    </tr>
    <tr>
        <td>CITY OFFICER</td>
        <td>
            <div className="form-check form-check-muted m-0">
                <label className="form-check-label">
                    <input type="checkbox" style={{ width: '20px', height: '20px', border: '2px solid black' }} className="form-check-input" />
                </label>
            </div>
        </td>
    </tr>
    <tr>
        <td>CMHO</td>
        <td>
            <div className="form-check form-check-muted m-0">
                <label className="form-check-label">
                    <input type="checkbox" style={{ width: '20px', height: '20px', border: '2px solid black' }} className="form-check-input" />
                </label>
            </div>
        </td>
    </tr>
    <tr>
        <td>CMO</td>
        <td>
            <div className="form-check form-check-muted m-0">
                <label className="form-check-label">
                    <input type="checkbox" style={{ width: '20px', height: '20px', border: '2px solid black' }} className="form-check-input" />
                </label>
            </div>
        </td>
    </tr>
    <tr>
        <td>COMMISSIONER</td>
        <td>
            <div className="form-check form-check-muted m-0">
                <label className="form-check-label">
                    <input type="checkbox" style={{ width: '20px', height: '20px', border: '2px solid black' }} className="form-check-input" />
                </label>
            </div>
        </td>
    </tr>
    <tr>
        <td>DISTRICT OFFICER</td>
        <td>
            <div className="form-check form-check-muted m-0">
                <label className="form-check-label">
                    <input type="checkbox" style={{ width: '20px', height: '20px', border: '2px solid black' }} className="form-check-input" />
                </label>
            </div>
        </td>
    </tr>
    <tr>
        <td>Doctor</td>
        <td>
            <div className="form-check form-check-muted m-0">
                <label className="form-check-label">
                    <input type="checkbox" style={{ width: '20px', height: '20px', border: '2px solid black' }} className="form-check-input" />
                </label>
            </div>
        </td>
    </tr>
    <tr>
        <td>DRIVER</td>
        <td>
            <div className="form-check form-check-muted m-0">
                <label className="form-check-label">
                    <input type="checkbox" style={{ width: '20px', height: '20px', border: '2px solid black' }} className="form-check-input" />
                </label>
            </div>
        </td>
    </tr>
    <tr>
        <td>Lab Tech</td>
        <td>
            <div className="form-check form-check-muted m-0">
                <label className="form-check-label">
                    <input type="checkbox" style={{ width: '20px', height: '20px', border: '2px solid black' }} className="form-check-input" />
                </label>
            </div>
        </td>
    </tr>
    <tr>
        <td>NODAL OFFICER</td>
        <td>
            <div className="form-check form-check-muted m-0">
                <label className="form-check-label">
                    <input type="checkbox" style={{ width: '20px', height: '20px', border: '2px solid black' }} className="form-check-input" />
                </label>
            </div>
        </td>
    </tr>
    <tr>
        <td>PAYMENT OFFICER</td>
        <td>
            <div className="form-check form-check-muted m-0">
                <label className="form-check-label">
                    <input type="checkbox" style={{ width: '20px', height: '20px', border: '2px solid black' }} className="form-check-input" />
                </label>
            </div>
        </td>
    </tr>
    <tr>
        <td>PHARMACIST</td>
        <td>
            <div className="form-check form-check-muted m-0">
                <label className="form-check-label">
                    <input type="checkbox" style={{ width: '20px', height: '20px', border: '2px solid black' }} className="form-check-input" />
                </label>
            </div>
        </td>
    </tr>
    <tr>
        <td>SR. AUDITOR</td>
        <td>
            <div className="form-check form-check-muted m-0">
                <label className="form-check-label">
                    <input type="checkbox" style={{ width: '20px', height: '20px', border: '2px solid black' }} className="form-check-input" />
                </label>
            </div>
        </td>
    </tr>
    <tr>
        <td>SENIOR AUDITOR</td>
        <td>
            <div className="form-check form-check-muted m-0">
                <label className="form-check-label">
                    <input type="checkbox" style={{ width: '20px', height: '20px', border: '2px solid black' }} className="form-check-input" />
                </label>
            </div>
        </td>
    </tr>
    <tr>
        <td>STATE OFFICER</td>
        <td>
            <div className="form-check form-check-muted m-0">
                <label className="form-check-label">
                    <input type="checkbox" style={{ width: '20px', height: '20px', border: '2px solid black' }} className="form-check-input" />
                </label>
            </div>
        </td>
    </tr>
    <tr>
        <td>SUB COMMISSIONER</td>
        <td>
            <div className="form-check form-check-muted m-0">
                <label className="form-check-label">
                    <input type="checkbox" style={{ width: '20px', height: '20px', border: '2px solid black' }} className="form-check-input" />
                </label>
            </div>
        </td>
    </tr>
    <tr>
        <td>SUB NODAL OFFICER</td>
        <td>
            <div className="form-check form-check-muted m-0">
                <label className="form-check-label">
                    <input type="checkbox" style={{ width: '20px', height: '20px', border: '2px solid black' }} className="form-check-input" />
                </label>
            </div>
        </td>
    </tr>
    <tr>
        <td>SUPER ADMIN</td>
        <td>
            <div className="form-check form-check-muted m-0">
                <label className="form-check-label">
                    <input type="checkbox" style={{ width: '20px', height: '20px', border: '2px solid black' }} className="form-check-input" />
                </label>
            </div>
        </td>
    </tr>
    <tr>
        <td>SUPER USER</td>
        <td>
            <div className="form-check form-check-muted m-0">
                <label className="form-check-label">
                    <input type="checkbox" style={{ width: '20px', height: '20px', border: '2px solid black' }} className="form-check-input" />
                </label>
            </div>
        </td>
    </tr>
    <tr>
        <td>UPSS</td>
        <td>
            <div className="form-check form-check-muted m-0">
                <label className="form-check-label">
                    <input type="checkbox" style={{ width: '20px', height: '20px', border: '2px solid black' }} className="form-check-input" />
                </label>
            </div>
        </td>
    </tr>
    <tr>
        <td>UPSS OFFICER</td>
        <td>
            <div className="form-check form-check-muted m-0">
                <label className="form-check-label">
                    <input type="checkbox" style={{ width: '20px', height: '20px', border: '2px solid black' }} className="form-check-input" />
                </label>
            </div>
        </td>
    </tr>
    <tr>
        <td>VENDOR</td>
        <td>
            <div className="form-check form-check-muted m-0">
                <label className="form-check-label">
                    <input type="checkbox" style={{ width: '20px', height: '20px', border: '2px solid black' }} className="form-check-input" />
                </label>
            </div>
        </td>
    </tr>
</tbody>
                                    </table>
                                </div>
                                <div className="d-flex justify-content-end mt-4">
                                    <button type="button" className="btn btn-success me-2" >
                                        <i className="mdi mdi-plus"></i> Save
                                    </button>
                                    <button type="button" className="btn btn-warning">
                                        <i className="mdi mdi-refresh"></i> Reset
                                    </button>
                                </div>
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

export default Rolesrights;
