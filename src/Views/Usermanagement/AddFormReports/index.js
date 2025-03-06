import React, { useState } from "react";
import Popup from "../../../Components/popup";


const Addformreports = () => {
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

                                <h5 className="bg-light p-3 rounded">Add Forms/Reports</h5>
                                <form className="forms row">

                                    {isEditMode && (
                                        <div className="row">
                                        <div className="form-group col-6 d-flex align-items-center"> {/* Use col-12 to occupy full width */}

                                            <label className="me-2 mb-0">Menu Name <span className="text-danger">*</span></label> {/* Added margin to the label */}
                                            <input
                                                type="text"
                                                className="form-control me-2" // Added margin to the input
                                                id="extraMenuName"
                                                placeholder="Extra Menu Name"
                                                required
                                            />
                                            <button type="submit" className="btn btn-primary">
                                                Submit
                                            </button>
                                        </div>
                                        </div>
                                    )}
                                    <div className="form-group col-md-4"> {/* Added margin-top to create space above */}
                                        <label>Menu Id <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="menuId"
                                            placeholder="Menu Id"
                                            required
                                        />
                                    </div>
                                    <div className="form-group col-md-4">
                                        <label>Menu Name <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="menuName"
                                            placeholder="Menu Name"
                                            required
                                        />
                                    </div>
                                    <div className="form-group col-md-4">
                                        <label>Parent Id</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="parentId"
                                            placeholder="Parent Id"
                                        />
                                    </div>
                                    <div className="form-group col-md-4">
                                        <label>URL <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="url"
                                            placeholder="URL"
                                            required
                                        />
                                    </div>
                                    <div className="form-group col-md-4">
                                        <label>Status <span className="text-danger">*</span></label>
                                        <select className="form-control" id="status" required>
                                            <option value="">Select Status</option>
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </div>
                                    <div className="form-group col-md-12 d-flex justify-content-end">
                                        {isEditMode ? (
                                            <>
                                                <button onClick={handleEditClick} className="btn btn-primary me-2">
                                                    Back
                                                </button>
                                                <button type="submit" className="btn btn-primary me-2">
                                                    Update
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={handleAddClick} className="btn btn-primary me-2">
                                                    Add
                                                </button>
                                                <button onClick={handleEditClick} className="btn btn-primary me-2">
                                                    Edit
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </form>
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

export default Addformreports;
