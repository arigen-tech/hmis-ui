import React, { useState } from "react";
import Popup from "../../../Components/popup";


const Assignapplicaton = () => {
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


    const handleAddClick = () => {
        setPopupMessage({
            message: "Please Enter Valid Menu Name",
            type: "warning", // You can set the type as needed
            onClose: () => setShowModal(false) // Function to close the modal
        });
        setShowModal(true); // Show the modal
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


                                <div className="row mt-3">
                                    <div className="form-group col-md-4">
                                        <label>Template Name</label>
                                    </div>
                                    <div className="form-group col-md-4">
                                        <select
                                            className="form-control"
                                            id="templateSelect"
                                            required
                                        >
                                            <option value="" disabled>Select Template</option>
                                            <option value="template1">Standard Template</option>
                                            <option value="template2">Premium Template</option>
                                            <option value="template3">Custom Template</option>
                                        </select>
                                    </div>
                                    <div className="form-group col-md-4">
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            onClick={handleAddClick}
                                        >
                                            Application
                                        </button>
                                    </div>
                                </div>
                                <table className="mt-3 table table-bordered table-hover align-middle">

                                    <thead className="table-light">
                                        <tr>
                                            <th>Application Code</th>
                                            <th>Application Name</th>
                                            
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <td>adfjas;</td>
                                        <td>adfjas;</td>
                                       
                                    </tbody>
                                </table>
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

export default Assignapplicaton;
