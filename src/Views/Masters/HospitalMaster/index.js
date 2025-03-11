import { useState, useEffect } from "react"
import Popup from "../../../Components/popup";

const Hospitalmaster = () => {
    const [formData, setFormData] = useState({
        hospitalName: "",
        state: "",
        city: "",
        regCost: "",
        appointmentCost: "",
        preConsultation: "",
        address: "",
        country: "",
        district: "",
        pincode: "",
        contactNumber1: "",
        contactNumber2: "",
        email: ""
    });
    const [showForm, setShowForm] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingHospital, setEditingHospital] = useState(null);
    const [popupMessage, setPopupMessage] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [pageInput, setPageInput] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const [hospitalData, setHospitalData] = useState([
        { code: "H001", name: "Apollo Hospital", state: "Maharashtra", city: "Mumbai", regCost: "Yes", preConsultation: "Yes", status: "y", registrationCost: "Yes", appointmentCost: "Yes" },
        { code: "H002", name: "Fortis Healthcare", state: "Delhi", city: "New Delhi", regCost: "Yes", preConsultation: "Yes", status: "y", registrationCost: "Yes", appointmentCost: "Yes" },
        { code: "H003", name: "AIIMS", state: "Delhi", city: "New Delhi", regCost: "Yes", preConsultation: "No", status: "y", registrationCost: "No", appointmentCost: "No" },
        { code: "H004", name: "Max Healthcare", state: "Punjab", city: "Chandigarh", regCost: "Yes", preConsultation: "Yes", status: "y", registrationCost: "Yes", appointmentCost: "Yes" },
        { code: "H005", name: "Manipal Hospital", state: "Karnataka", city: "Bangalore", regCost: "Yes", preConsultation: "Yes", status: "y", registrationCost: "Yes", appointmentCost: "Yes" },
        { code: "H006", name: "Medanta", state: "Haryana", city: "Gurugram", regCost: "Yes", preConsultation: "Yes", status: "y", registrationCost: "Yes", appointmentCost: "Yes" },
        { code: "H007", name: "Narayana Health", state: "Karnataka", city: "Bangalore", regCost: "Yes", preConsultation: "No", status: "y", registrationCost: "No", appointmentCost: "No" },
        { code: "H008", name: "Kokilaben Hospital", state: "Maharashtra", city: "Mumbai", regCost: "Yes", preConsultation: "Yes", status: "y", registrationCost: "Yes", appointmentCost: "Yes" },
        { code: "H009", name: "Tata Memorial", state: "Maharashtra", city: "Mumbai", regCost: "Yes", preConsultation: "Yes", status: "y", registrationCost: "Yes", appointmentCost: "Yes" },
        { code: "H010", name: "Christian Medical College", state: "Tamil Nadu", city: "Vellore", regCost: "Yes", preConsultation: "No", status: "y", registrationCost: "No", appointmentCost: "No" },
        { code: "H011", name: "Lilavati Hospital", state: "Maharashtra", city: "Mumbai", regCost: "Yes", preConsultation: "Yes", status: "y", registrationCost: "Yes", appointmentCost: "Yes" },
        { code: "H012", name: "Artemis Hospital", state: "Haryana", city: "Gurugram", regCost: "Yes", preConsultation: "Yes", status: "y", registrationCost: "Yes", appointmentCost: "Yes" },
        { code: "H013", name: "Hinduja Hospital", state: "Maharashtra", city: "Mumbai", regCost: "Yes", preConsultation: "Yes", status: "y", registrationCost: "Yes", appointmentCost: "Yes" },
        { code: "H014", name: "Ruby Hall Clinic", state: "Maharashtra", city: "Pune", regCost: "Yes", preConsultation: "No", status: "y", registrationCost: "No", appointmentCost: "No" },
        { code: "H015", name: "Jaslok Hospital", state: "Maharashtra", city: "Mumbai", regCost: "Yes", preConsultation: "Yes", status: "y", registrationCost: "Yes", appointmentCost: "Yes" },
        { code: "H016", name: "Wockhardt Hospital", state: "Maharashtra", city: "Mumbai", regCost: "Yes", preConsultation: "Yes", status: "y", registrationCost: "Yes", appointmentCost: "Yes" },
        { code: "H017", name: "Columbia Asia", state: "Karnataka", city: "Bangalore", regCost: "Yes", preConsultation: "No", status: "y", registrationCost: "No", appointmentCost: "No" },
        { code: "H018", name: "Shalby Hospital", state: "Gujarat", city: "Ahmedabad", regCost: "Yes", preConsultation: "Yes", status: "y", registrationCost: "Yes", appointmentCost: "Yes" },
        { code: "H019", name: "Sterling Hospital", state: "Gujarat", city: "Ahmedabad", regCost: "Yes", preConsultation: "No", status: "y", registrationCost: "No", appointmentCost: "No" },
        { code: "H020", name: "Aster DM Healthcare", state: "Kerala", city: "Kochi", regCost: "Yes", preConsultation: "Yes", status: "y", registrationCost: "Yes", appointmentCost: "Yes" },
        { code: "H021", name: "Yashoda Hospitals", state: "Telangana", city: "Hyderabad", regCost: "Yes", preConsultation: "Yes", status: "y", registrationCost: "Yes", appointmentCost: "Yes" },
    ]);

    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, hospitalId: null, newStatus: false });
    const [totalFilteredProducts, setTotalFilteredProducts] = useState(0);

    const filteredHospitals = hospitalData.filter(hospital =>
        hospital.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const handleEdit = (hospital) => {
        setEditingHospital(hospital);
        setShowForm(true);
        setFormData({
            code : hospital.code,
            hospitalName: hospital.name,
            state: hospital.state,
            city: hospital.city,
            regCost: hospital.regCost,
            appointmentCost: hospital.appointmentCost,
            preConsultation: hospital.preConsultation,
            address: hospital.address || "",
            country: hospital.country || "",
            district: hospital.district || "",
            pincode: hospital.pincode || "",
            contactNumber1: hospital.contactNumber1 || "",
            contactNumber2: hospital.contactNumber2 || "",
            email: hospital.email || "",
        });
    };

    const handleSave = (e) => {
        e.preventDefault();

        const form = e.target;
        const updatedHospitalName = form.name.value;
        const updatedState = form.stateSelect.value;
        const updatedCity = form.city.value;
        const updatedRegCost = form.registrationcost.value;
        const updatedAppointmentCost = form.appointmentcost.value;
        const updatedPreConsultation = form.preconsultationcost.value;

        // Get additional fields
        const updatedAddress = form.address.value;
        const updatedCountry = form.countrySelect.value;
        const updatedDistrict = form.districtSelect.value;
        const updatedPincode = form.pincode.value;
        const updatedContactNumber1 = form.contactnumber1.value;
        const updatedContactNumber2 = form.contactnumber2.value;
        const updatedEmail = form.email.value;
        const updatedCode = form.code.value;


        if (editingHospital) {
            setHospitalData(hospitalData.map(hospital =>
                hospital.id === editingHospital.id
                    ? {
                        ...hospital,
                        name: updatedHospitalName,
                        state: updatedState,
                        city: updatedCity,
                        regCost: updatedRegCost,
                        appointmentCost: updatedAppointmentCost,
                        preConsultation: updatedPreConsultation,
                        address: updatedAddress,
                        country: updatedCountry,
                        district: updatedDistrict,
                        pincode: updatedPincode,
                        contactNumber1: updatedContactNumber1,
                        contactNumber2: updatedContactNumber2,
                        email: updatedEmail,
                        code: updatedCode
                    }
                    : hospital
            ));
        } else {
            const newHospital = {
                id: hospitalData.length + 1,
                code: updatedCode,
                name: updatedHospitalName,
                state: updatedState,
                city: updatedCity,
                regCost: updatedRegCost,
                appointmentCost: updatedAppointmentCost,
                preConsultation: updatedPreConsultation,
                address: updatedAddress,
                country: updatedCountry,
                district: updatedDistrict,
                pincode: updatedPincode,
                contactNumber1: updatedContactNumber1,
                contactNumber2: updatedContactNumber2,
                email: updatedEmail,
                status: "y"
            };
            setHospitalData([...hospitalData, newHospital]);
        }

        setEditingHospital(null);
        setShowForm(false);
        showPopup("Changes saved successfully!", "success");
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

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        // Map form field IDs to state property names
        const fieldMapping = {
            code: "code",
            name: "hospitalName",
            stateSelect: "state",
            city: "city",
            registrationcost: "regCost",
            appointmentcost: "appointmentCost",
            preconsultationcost: "preConsultation",
            address: "address",
            countrySelect: "country",
            districtSelect: "district",
            pincode: "pincode",
            contactnumber1: "contactNumber1",
            contactnumber2: "contactNumber2",
            email: "email"
        };

        const stateField = fieldMapping[id] || id;
        setFormData(prevData => ({ ...prevData, [stateField]: value }));
    }

    const handleCreateFormSubmit = (e) => {
        e.preventDefault()
        if (formData.hospitalName) {
            setHospitalData([...hospitalData, { ...formData, id: Date.now(), status: "y" }])
            setFormData({ hospitalName: "", state: "", city: "", regCost: "", appointmentCost: "", preConsultation: "" })
            setShowForm(false)
        } else {
            alert("Please fill out all required fields.")
        }
    }

    const handleSwitchChange = (id, newStatus) => {
        setConfirmDialog({ isOpen: true, hospitalId: id, newStatus });
    };

    const handleConfirm = (confirmed) => {
        if (confirmed && confirmDialog.hospitalId !== null) {
            setHospitalData((prevData) =>
                prevData.map((hospital) =>
                    hospital.id === confirmDialog.hospitalId ? { ...hospital, status: confirmDialog.newStatus } : hospital
                )
            );
        }
        setConfirmDialog({ isOpen: false, hospitalId: null, newStatus: null });
    };

    const filteredTotalPages = Math.ceil(filteredHospitals.length / itemsPerPage);

    const currentItems = filteredHospitals.slice(
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
                            <h4 className="card-title">Hospital Master</h4>
                            <div className="d-flex justify-content-between align-items-center">

                                {!showForm ? (
                                    <form className="d-inline-block searchform me-4" role="search">
                                        <div className="input-group searchinput">
                                            <input
                                                type="search"
                                                className="form-control"
                                                placeholder="Search Hospitals"
                                                aria-label="Search"
                                                value={searchQuery}
                                                onChange={handleSearch}

                                            />
                                            <span className="input-group-text" id="search-icon">
                                                <i className="fa fa-search"></i>
                                            </span>
                                        </div>
                                    </form>
                                ) : (
                                    <></>
                                )}


                                <div className="d-flex align-items-center">
                                    {!showForm ? (
                                        <>
                                            <button type="button" className="btn btn-success me-2" onClick={() => setShowForm(true)}>
                                                <i className="mdi mdi-plus"></i> Add
                                            </button>
                                            <button type="button" className="btn btn-success me-2">
                                                <i className="mdi mdi-plus"></i> Show All
                                            </button>
                                            <button type="button" className="btn btn-success me-2" onClick={() => setShowModal(true)}>
                                                <i className="mdi mdi-plus"></i> Reports
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
                                <div className="table-responsive packagelist">
                                    <table className="table table-bordered table-hover align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Code</th>
                                                <th>Name</th>
                                                <th>State</th>
                                                <th>City</th>
                                                <th>Reg. Cost</th>
                                                <th>Appointment Cost</th>
                                                <th>Pre Consultation</th>
                                                <th>Status</th>
                                                <th>Edit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentItems.map((hospital) => (
                                                <tr key={hospital.id}>
                                                    <td>{hospital.code}</td>
                                                    <td>{hospital.name}</td>
                                                    <td>{hospital.state}</td>
                                                    <td>{hospital.city}</td>
                                                    <td>{hospital.regCost}</td>
                                                    <td>{hospital.appointmentCost}</td>
                                                    <td>{hospital.preConsultation}</td>
                                                    <td>
                                                        <div className="form-check form-switch">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                checked={hospital.status === "y"}
                                                                onChange={() => handleSwitchChange(hospital.id, hospital.status === "y" ? "n" : "y")}
                                                                id={`switch-${hospital.id}`}
                                                            />
                                                            <label
                                                                className="form-check-label px-0"
                                                                htmlFor={`switch-${hospital.id}`}
                                                            >
                                                                {hospital.status === "y" ? 'Active' : 'Deactive'}
                                                            </label>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="btn btn-sm btn-success me-2"
                                                            onClick={() => handleEdit(hospital)}
                                                            disabled={hospital.status !== "y"}
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
                                                Page {currentPage} of {filteredTotalPages} | Total Records: {filteredHospitals.length}
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
                            ) : (
                                <form className="forms row" onSubmit={handleSave}>
                                    <div className="card-body">
                                        <div className="row g-3 align-items-center">
                                            <div className="col-md-6">
                                                <label htmlFor="code" className="form-label">
                                                    Code
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="code"
                                                    value={formData.code || ""} 
                                                    onChange={(e) => {
                                                        setFormData(prevData => ({ ...prevData, code: e.target.value })); 
                                                    }}
                                                    placeholder="Enter code (optional)" 
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label htmlFor="name" className="form-label">Name</label>
                                                <input type="text" className="form-control" id="name" value={formData.hospitalName ? formData.hospitalName : ""} onChange={handleInputChange} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label htmlFor="address" className="form-label">Address</label>
                                                <input type="text" className="form-control" id="address" value={formData.address || ""} onChange={handleInputChange} />
                                            </div>
                                            <div className="col-md-6">
                                                <label htmlFor="countrySelect" className="form-label">Country</label>
                                                <select className="form-control mt-1" id="countrySelect" value={formData.country || ""} onChange={handleInputChange} >
                                                    <option value="" disabled>Select Country</option>
                                                    <option value="India">India</option>
                                                    <option value="Afghanistan">Afghanistan</option>
                                                    <option value="Russia">Russia</option>
                                                    <option value="China">China</option>
                                                </select>
                                            </div>
                                            <div className="col-md-6">
                                                <label htmlFor="stateSelect" className="form-label">State</label>
                                                <select className="form-control mt-1" id="stateSelect" value={formData.state} onChange={handleInputChange} required>
                                                    <option value="" disabled>Select State</option>
                                                    <option value="UP">UP</option>
                                                    <option value="Madhya Pradesh">Madhya Pradesh</option>
                                                    <option value="Jharkhand">Jharkhand</option>
                                                    <option value="Maharashtra">Maharashtra</option>
                                                </select>
                                            </div>
                                            <div className="col-md-6">
                                                <label htmlFor="districtSelect" className="form-label">District</label>
                                                <select className="form-control mt-1" id="districtSelect" >
                                                    <option value="" selected disabled>Select District</option>
                                                    <option value="Agra">Agra</option>
                                                    <option value="Lucknow">Lucknow</option>
                                                    <option value="Varanasi">Varanasi</option>
                                                    <option value="Kanpur">Kanpur</option>
                                                    <option value="Ghaziabad">Ghaziabad</option>
                                                    <option value="Noida">Noida</option>
                                                    <option value="Meerut">Meerut</option>
                                                    <option value="Aligarh">Aligarh</option>
                                                </select>
                                            </div>
                                            <div className="col-md-6">
                                                <label htmlFor="city" className="form-label">City</label>
                                                <input type="text" className="form-control" id="city" value={formData.city} onChange={handleInputChange} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label htmlFor="pincode" className="form-label">Pin Code</label>
                                                <input type="text" className="form-control" id="pincode" />
                                            </div>
                                            <div className="col-md-6">
                                                <label htmlFor="contactnumber1" className="form-label">Contact Number 1</label>
                                                <input type="text" className="form-control" id="contactnumber1" />
                                            </div>
                                            <div className="col-md-6">
                                                <label htmlFor="contactnumber2" className="form-label">Contact Number 2</label>
                                                <input type="text" className="form-control" id="contactnumber2" />
                                            </div>
                                            <div className="col-md-6">
                                                <label htmlFor="email" className="form-label">Email</label>
                                                <input type="email" className="form-control" id="email" />
                                            </div>
                                            <div className="col-md-6">
                                                <label htmlFor="registrationcost" className="form-label">Registration Cost</label>
                                                <select className="form-control" id="registrationcost" value={formData.regCost} onChange={handleInputChange} required>
                                                    <option value="" disabled>Select</option>
                                                    <option value="Yes">Yes</option>
                                                    <option value="No">No</option>
                                                </select>
                                            </div>
                                            <div className="col-md-6">
                                                <label htmlFor="appointmentcost" className="form-label">Appointment Cost</label>
                                                <select className="form-control" id="appointmentcost" value={formData.appointmentCost} onChange={handleInputChange} required>
                                                    <option value="" disabled>Select</option>
                                                    <option value="Yes">Yes</option>
                                                    <option value="No">No</option>
                                                </select>
                                            </div>
                                            <div className="col-md-6">
                                                <label htmlFor="preconsultationcost" className="form-label">Pre Consultation</label>
                                                <select className="form-control mt-1" id="preconsultationcost" value={formData.preConsultation} onChange={handleInputChange} required>
                                                    <option value="" disabled>Select</option>
                                                    <option value="Yes">YES</option>
                                                    <option value="No">NO</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="form-group col-md-12 d-flex justify-content-end mt-2">
                                        <button type="submit" className="btn btn-primary me-2" >Save</button>
                                        <button type="button" className="btn btn-danger" onClick={() => setShowForm(false)}>Cancel</button>
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
                                                    Are you sure you want to {confirmDialog.newStatus === "y" ? 'activate' : 'deactivate'} <strong>{hospitalData.find(hospital => hospital.id === confirmDialog.hospitalId)?.name}</strong>?
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

export default Hospitalmaster;
