import React, { useState, useEffect } from "react";
import placeholderImage from "../../../../assets/images/placeholder.jpg";
import { COUNTRYAPI, DISTRICTAPI, STATEAPI, DEPARTMENT, GENDERAPI, EMPLOYEE_REGISTRATION, IDENTITY_TYPE, API_HOST } from "../../../../config/apiConfig";
import { getRequest, putRequest, postRequestWithFormData } from "../../../../service/apiService";
import Popup from "../../../../Components/popup";

const EmployeeRegistration = () => {
    const initialFormData = {
        profilePicName: null,
        idDocumentName: null,

        firstName: "",
        middleName: "",
        lastName: "",
        dob: "",
        genderId: "",
        address1: "",
        countryId: "",
        stateId: "",
        districtId: "",
        city: "",
        pincode: "",
        mobileNo: "",
        registrationNo: "",
        employmentTypeId: 1,
        deprtId: "",
        identificationType: "",
        employeeTypeId: 1,
        email: "dkraj@gmail.com",
        fromDate: "",

        qualification: [{ employeeQualificationId: 1, institutionName: "", completionYear: 0, qualificationName: "", filePath: null }],
        document: [{ employeeDocumentId: 1, documentName: "", filePath: null }],
    };
    const [formData, setFormData] = useState(initialFormData);
    const [popup, setPopup] = useState("");
    const [popupMessage, setPopupMessage] = useState("");
    const [profileImage, setProfileImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [departmentData, setDepartmentData] = useState([]);
    const [viewDept, setviewDept] = useState(false);
    const [countryData, setCountryData] = useState([]);
    const [stateData, setStateData] = useState([]);
    const [districtData, setDistrictData] = useState([]);
    const [genderData, setGenderData] = useState([]);
    const [idTypeData, setIdTypeData] = useState([]);
    const [countryIds, setCountryIds] = useState("");
    const [stateIds, setStateIds] = useState("");
    const token = "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJhYmNAZ21haWwuY29tIiwiaG9zcGl0YWxJZCI6MSwiZW1wbG95ZWVJZCI6MSwiZXhwIjoxNzQ0MTc2MTQ1LCJ1c2VySWQiOjQsImlhdCI6MTc0MzU3MTM0NX0.3PZYyg8u5o_vdifT-Zoyg259CnLrvFEl0EBdqccndzDOsUwxVwClToST3s6BnQQGP0CnUjijpix9nguuqBz0ow";

    useEffect(() => {
        fetchCountryData();
        fetchDepartmentData();
        fetchGenderData();
        fetchIdTypeData();
    }, []);

    const showPopup = (message, type = "info") => {
        setPopupMessage({
            message,
            type,
            onClose: () => {
                setPopupMessage(null);
            },
        });
    };

    const fetchCountryData = async () => {
        setLoading(true);
        try {
            const data = await getRequest(`${COUNTRYAPI}/getAllCountries/1`);
            if (data.status === 200 && Array.isArray(data.response)) {
                setCountryData(data.response);
            } else {
                console.error("Unexpected API response format:", data);
                setCountryData([]);
            }
        } catch (error) {
            console.error("Error fetching country data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartmentData = async () => {
        setLoading(true);
        try {
            const data = await getRequest(`${DEPARTMENT}/getAllDepartments/1`);
            if (data.status === 200 && Array.isArray(data.response)) {
                setDepartmentData(data.response);
            } else {
                console.error("Unexpected API response format:", data);
                setDepartmentData([]);
            }
        } catch (error) {
            console.error("Error fetching Department data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStateData = async (countryIds) => {
        setLoading(true);
        try {
            const GET_STATES = `${STATEAPI}/country/${countryIds}`;
            const data = await getRequest(GET_STATES);
            if (data.status === 200 && Array.isArray(data.response)) {
                setStateData(data.response);
            } else {
                console.error("Unexpected API response format:", data);
                setStateData([]);
            }
        } catch (error) {
            console.error("Error fetching state data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDistrictData = async (stateIds) => {
        setLoading(true);
        try {
            const GET_CITIES = `${DISTRICTAPI}/state/${stateIds}`;
            const data = await getRequest(GET_CITIES);
            if (data.status === 200 && Array.isArray(data.response)) {
                setDistrictData(data.response);
            } else {
                console.error("Unexpected API response format:", data);
                setDistrictData([]);
            }
        } catch (error) {
            console.error("Error fetching city data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchGenderData = async () => {
        setLoading(true);
        try {
            const data = await getRequest(`${GENDERAPI}/getAll/1`);
            if (data.status === 200 && Array.isArray(data.response)) {
                setGenderData(data.response);
            } else {
                console.error("Unexpected API response format:", data);
                setGenderData([]);
            }
        } catch (error) {
            console.error("Error fetching HotelType data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchIdTypeData = async () => {
        setLoading(true);
        try {
            const data = await getRequest(`${IDENTITY_TYPE}/getAllIdentificationTypes/1`);
            if (data.status === 200 && Array.isArray(data.response)) {
                setIdTypeData(data.response);
            } else {
                console.error("Unexpected API response format:", data);
                setIdTypeData([]);
            }
        } catch (error) {
            console.error("Error fetching HotelType data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCountryChange = (countryCode, id) => {
        setFormData((prevState) => ({
            ...prevState,
            countryId: id,
            stateId: "",
            districtId: "",
        }));
        fetchStateData(countryCode);
    };

    const handleStateChange = (stateCode, id) => {
        setFormData((prevState) => ({
            ...prevState,
            stateId: id,
            districtId: "",
        }));
        fetchDistrictData(stateCode);
    };

    const handleDistrictChange = (districtId) => {
        setFormData((prevState) => ({
            ...prevState,
            districtId: districtId,
        }));
    };

    const handleGenderChange = (gendersId) => {
        setFormData((prevState) => ({
            ...prevState,
            genderId: gendersId,
        }));
    };

    const handleDepartmentChange = (deprtId) => {
        setFormData((prevState) => ({
            ...prevState,
            deprtId: deprtId,
        }));
    };

    const handleIdTypeChange = (idTypeId) => {
        setFormData((prevState) => ({
            ...prevState,
            identificationType: idTypeId,
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
    
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData((prevFormData) => ({
                    ...prevFormData,
                    profilePicName: file,  
                    profilePicPreview: reader.result, 
                }));
            };
            reader.readAsDataURL(file);
        }
    };
    

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [id]: value }));
    };

    const addEducationRow = (e) => {
        e.preventDefault();

        setFormData((prev) => ({
            ...prev,
            qualification: [
                ...prev.qualification,
                { id: prev.qualification.length + 1, institutionName: "", completionYear: "", qualificationName: "", filePath: null },
            ],
        }));
    };

    const removeEducationRow = (index) => {
        setFormData((prev) => ({
            ...prev,
            qualification: prev.qualification.filter((_, i) => i !== index),
        }));
    };

    const addDocumentRow = () => {
        setFormData((prev) => ({
            ...prev,
            document: [
                ...prev.document,
                { id: prev.document.length + 1, documentName: "", filePath: null },
            ],
        }));
    };

    const removeDocumentRow = (index) => {
        setFormData((prev) => ({
            ...prev,
            document: prev.document.filter((_, i) => i !== index),
        }));
    };

    const handleQualificationChange = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            qualification: prev.qualification.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        }));
    };

    const handleDocumentChange = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            document: prev.document.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        }));
    };

    const validateForm = () => {
        const requiredFields = [
            'firstName', 'lastName', 'dob', 'genderId', 'address1',
            'countryId', 'stateId', 'districtId', 'city', 'pincode',
            'mobileNo', 'identificationType', 'registrationNo'
        ];

        for (const field of requiredFields) {
            if (!formData[field]) {
                showPopup(`Please fill in the required field: ${field.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}`, "error");
                return false;
            }
        }

        if (!formData.profilePicName) {
            showPopup("Profile picture is required", "error");
            return false;
        }

        if (!formData.idDocumentName) {
            showPopup("ID document is required", "error");
            return false;
        }

        return true;
    };

    const prepareFormData = () => {
        if (!validateForm()) {
            return null;
        }

        const formDataToSend = new FormData();

        formDataToSend.append('firstName', formData.firstName);
        formDataToSend.append('lastName', formData.lastName);
        if (formData.middleName) formDataToSend.append('middleName', formData.middleName);
        formDataToSend.append('dob', new Date(formData.dob).toISOString().split('T')[0]);
        formDataToSend.append('genderId', formData.genderId);
        formDataToSend.append('address1', formData.address1);
        formDataToSend.append('countryId', formData.countryId);
        formDataToSend.append('stateId', formData.stateId);
        formDataToSend.append('districtId', formData.districtId);
        formDataToSend.append('city', formData.city);
        formDataToSend.append('pincode', formData.pincode);
        formDataToSend.append('mobileNo', formData.mobileNo);
        formDataToSend.append('registrationNo', formData.registrationNo);
        formDataToSend.append('identificationType', formData.identificationType);
        formDataToSend.append('fromDate', new Date(formData.fromDate).toISOString());

        if (formData.deprtId) {
            formDataToSend.append('departmentId', formData.deprtId);
        }

        // Files Handling
        if (formData.profilePicName) {
            formDataToSend.append('profilePicName', formData.profilePicName);
        }
        if (formData.idDocumentName) {
            formDataToSend.append('idDocumentName', formData.idDocumentName);
        }

        // Qualification
        formData.qualification.forEach((qual, index) => {
            formDataToSend.append(`qualification[${index}].employeeQualificationId`, qual.employeeQualificationId || '');
            formDataToSend.append(`qualification[${index}].institutionName`, qual.institutionName);
            formDataToSend.append(`qualification[${index}].completionYear`, qual.completionYear);
            formDataToSend.append(`qualification[${index}].qualificationName`, qual.qualificationName);
            if (qual.filePath) {
                formDataToSend.append(`qualification[${index}].filePath`, qual.filePath);
            }
        });

        // Documents
        formData.document.forEach((doc, index) => {
            formDataToSend.append(`document[${index}].employeeDocumentId`, doc.employeeDocumentId || '');
            formDataToSend.append(`document[${index}].documentName`, doc.documentName);
            if (doc.filePath) {
                formDataToSend.append(`document[${index}].filePath`, doc.filePath);
            }
        });

        return formDataToSend;
    };

    const handleReset = () => {
        setFormData(initialFormData);
    };


    const handleCreate = async () => {
        const formDataToSend = prepareFormData();
        if (!formDataToSend) return;

        setLoading(true);
        try {
            const response = await fetch(`${API_HOST}/api/employee/create`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                body: formDataToSend
            });

            const data = await response.json();

            if (response.ok) {
                showPopup("Employee created successfully", "success");
                handleReset();
            } else {
                showPopup(`Error: ${data.message || 'Failed to create employee'}`, "error");
            }
        } catch (error) {
            console.error("Error creating employee:", error);
            showPopup("Error submitting form. Please try again.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateWithApprove = async () => {
        const formDataToSend = prepareFormData();
        if (!formDataToSend) return;

        // Ensure department ID is provided for approval
        if (!formData.deprtId) {
            setviewDept(true);
            showPopup("Department is required for approval. Please select a department.", "error");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_HOST}/api/employee/create-and-approve`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                body: formDataToSend
            });

            const data = await response.json();

            if (response.ok) {
                showPopup("Employee created and approved successfully", "success");
                handleReset();
            } else {
                showPopup(`Error: ${data.message || 'Failed to create and approve employee'}`, "error");
            }
        } catch (error) {
            console.error("Error creating and approving employee:", error);
            showPopup("Error submitting form. Please try again.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="d-flex body py-3">
                <div className="container-xxl">
                    {popupMessage && (
                        <Popup
                            message={popupMessage.message}
                            type={popupMessage.type}
                            onClose={popupMessage.onClose}
                        />
                    )}

                    <div className="row align-items-center">
                        <div className="border-0 mb-4">
                            <div className="d-flex flex-wrap card-header align-items-center bg-transparent border-bottom justify-content-between px-0 py-3">
                                <h3 className="fw-bold mb-0">Register of Employee</h3>
                            </div>
                        </div>
                    </div>

                    {/* employee Section */}
                    <div className="row mb-3">
                        <div className="col-sm-12">
                            <div className="card shadow mb-3">
                                <div className="card-header bg-light border-bottom-1 py-3">
                                    <h6 className="fw-bold mb-0">Employee Registration</h6>
                                </div>
                                <div className="card-body">
                                    <form>
                                        <div className="g-3 row">
                                            <div className="col-md-9">
                                                <div className="g-3 row">
                                                    <div className="col-md-4">
                                                        <label className="form-label">First Name *</label>
                                                        <input
                                                            type="text"
                                                            required
                                                            className="form-control"
                                                            id="firstName"
                                                            placeholder="First Name"
                                                            onChange={handleInputChange}
                                                            value={formData.firstName}
                                                        />
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="form-label">Middle Name</label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            id="middleName"
                                                            placeholder="Middle Name"
                                                            onChange={handleInputChange}
                                                            value={formData.middleName}
                                                        />
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="form-label">Last Name *</label>
                                                        <input
                                                            type="text"
                                                            required
                                                            className="form-control"
                                                            id="lastName"
                                                            placeholder="Last Name"
                                                            onChange={handleInputChange}
                                                            value={formData.lastName}
                                                        />
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="form-label">Date of Birth *</label>
                                                        <input
                                                            type="date"
                                                            required
                                                            id="dob"
                                                            value={formData.dob}
                                                            className="form-control"
                                                            onChange={handleInputChange}
                                                        />
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="form-label">Gender *</label>
                                                        <select
                                                            className="form-select"
                                                            style={{ paddingRight: "40px" }}
                                                            value={formData.genderId}
                                                            onChange={(e) =>
                                                                handleGenderChange(parseInt(e.target.value, 10))
                                                            }
                                                            disabled={loading}
                                                        >
                                                            <option value="">Select Gender</option>
                                                            {genderData.map((gender) => (
                                                                <option key={gender.id} value={gender.id}>
                                                                    {gender.genderName}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="form-label">Address *</label>
                                                        <textarea
                                                            required
                                                            id="address1"
                                                            value={formData.address1}
                                                            className="form-control"
                                                            onChange={handleInputChange}
                                                        ></textarea>

                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="form-label">Country *</label>
                                                        <select
                                                            className="form-select"
                                                            value={formData.countryId}
                                                            onChange={(e) => {
                                                                const selectedCountry = countryData.find(
                                                                    (country) => country.id.toString() === e.target.value
                                                                );
                                                                handleCountryChange(selectedCountry.countryCode, selectedCountry.id);
                                                                setCountryIds(selectedCountry.id);
                                                                fetchStateData(selectedCountry.id);
                                                            }}

                                                            disabled={loading}
                                                        >
                                                            <option value="">Select Country</option>
                                                            {countryData.map((country) => (
                                                                <option key={country.id} value={country.id}>
                                                                    {country.countryName}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="form-label">State *</label>
                                                        <select
                                                            className="form-select"
                                                            value={formData.stateId}
                                                            onChange={(e) => {
                                                                const selectedState = stateData.find(
                                                                    (state) => state.id.toString() === e.target.value
                                                                );
                                                                handleStateChange(selectedState.stateCode, selectedState.id);
                                                                setStateIds(selectedState.id);
                                                                fetchDistrictData(selectedState.id);
                                                            }}

                                                            disabled={loading || !formData.countryId}
                                                        >
                                                            <option value="">Select State</option>
                                                            {stateData.map((state) => (
                                                                <option key={state.id} value={state.id}>
                                                                    {state.stateName}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="form-label">District *</label>
                                                        <select
                                                            className="form-select"
                                                            value={formData.districtId}
                                                            onChange={(e) => handleDistrictChange(e.target.value)}
                                                            disabled={loading || !formData.stateId}
                                                        >
                                                            <option value="">Select District</option>
                                                            {districtData.map((dist) => (
                                                                <option key={dist.id} value={dist.id}>
                                                                    {dist.districtName}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="form-label">City *</label>
                                                        <input
                                                            type="text"
                                                            required
                                                            className="form-control"
                                                            id="city"
                                                            placeholder="City"
                                                            onChange={handleInputChange}
                                                            value={formData.city}
                                                        />
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="form-label">Pincode *</label>
                                                        <input
                                                            type="text"
                                                            required
                                                            className="form-control"
                                                            id="pincode"
                                                            placeholder="Pincode"
                                                            onChange={handleInputChange}
                                                            value={formData.pincode}
                                                        />
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="form-label">Mobile No. *</label>
                                                        <input
                                                            type="text"
                                                            required
                                                            className="form-control"
                                                            id="mobileNo"
                                                            placeholder="Mobile No."
                                                            onChange={handleInputChange}
                                                            value={formData.mobileNo}
                                                        />
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="form-label">ID Type *</label>
                                                        <select
                                                            className="form-select"
                                                            style={{ paddingRight: "40px" }}
                                                            value={formData.identificationType}
                                                            onChange={(e) =>
                                                                handleIdTypeChange(parseInt(e.target.value, 10))
                                                            }
                                                            disabled={loading}
                                                        >
                                                            <option value="">Select ID Type</option>
                                                            {idTypeData.map((idType) => (
                                                                <option key={idType.identificationTypeId} value={idType.identificationTypeId}>
                                                                    {idType.identificationName}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="form-label">ID Number *</label>
                                                        <input
                                                            type="text"
                                                            required
                                                            className="form-control"
                                                            id="registrationNo"
                                                            placeholder="ID Number"
                                                            onChange={handleInputChange}
                                                            value={formData.registrationNo}
                                                        />
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="form-label">ID Upload (JPEG/PDF) *</label>
                                                        <input
                                                            type="file"
                                                            id="idDocumentName"
                                                            className="form-control mt-2"
                                                            accept=".jpg,.jpeg,.png,.pdf"
                                                            onChange={(e) => setFormData({ ...formData, idDocumentName: e.target.files[0] })}
                                                        />
                                                    </div>

                                                    {viewDept && (
                                                        <div className="col-md-4">
                                                            <label className="form-label">Depatment Name *</label>
                                                            <select
                                                                className="form-select"
                                                                style={{ paddingRight: "40px" }}
                                                                value={formData.deprtId}
                                                                onChange={(e) =>
                                                                    handleDepartmentChange(parseInt(e.target.value, 10))
                                                                }
                                                                disabled={loading}
                                                            >
                                                                <option value="">Select Depatment</option>
                                                                {departmentData.map((depa) => (
                                                                    <option key={depa.id} value={depa.id}>
                                                                        {depa.departmentName}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    )}

                                                    <div className="col-md-4">
                                                        <label className="form-label">Period of Employment From Date</label>
                                                        <input
                                                            type="date"
                                                            id="fromDate"
                                                            value={formData.fromDate}
                                                            className="form-control"
                                                            onChange={handleInputChange}
                                                        />
                                                    </div>

                                                </div>
                                            </div>
                                            <div className="col-md-3 d-flex flex-column">
                                                <label className="form-label">Profile Image *</label>
                                                <div className="d-flex flex-column align-items-center border p-2">
                                                    <img
                                                        src={formData.profilePicPreview || placeholderImage}
                                                        alt="Profile"
                                                        className="img-fluid"
                                                        style={{ objectFit: "cover", maxWidth: "100%", height: "150px" }}
                                                    />
                                                    <input
                                                        type="file"
                                                        id="profilePicName"
                                                        className="form-control mt-2"
                                                        accept="image/*"
                                                        onChange={handleImageChange}
                                                    />
                                                </div>
                                            </div>

                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* Educational Qualification */}
                    <div className="row mb-3">
                        <div className="col-sm-12">
                            <div className="card shadow mb-3">
                                <div className="card-header bg-light border-bottom-1 py-3">
                                    <h6 className="fw-bold mb-0">Educational Qualification</h6>
                                </div>
                                <div className="card-body">
                                    <table className="table table-bordered">
                                        <thead>
                                            <tr>
                                                <th>S.No</th>
                                                <th>Degree</th>
                                                <th>Name of Institution</th>
                                                <th>Year of Completion</th>
                                                <th>File Upload</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formData.qualification.map((row, index) => (
                                                <tr key={index}>
                                                    <td>{index + 1}</td>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={row.qualificationName}
                                                            onChange={(e) => handleQualificationChange(index, "qualificationName", e.target.value)}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={row.institutionName}
                                                            onChange={(e) => handleQualificationChange(index, "institutionName", e.target.value)}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="YYYY"
                                                            value={row.completionYear}
                                                            onChange={(e) => handleQualificationChange(index, "completionYear", e.target.value)}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="file"
                                                            className="form-control"
                                                            onChange={(e) => handleQualificationChange(index, "filePath", e.target.files[0])}
                                                            accept=".pdf,.jpg,.jpeg,.png"
                                                        />
                                                    </td>
                                                    <td>
                                                        <button type="button" className="btn btn-danger" onClick={() => removeEducationRow(index)}>
                                                            <i className="icofont-close"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <button type="button" className="btn btn-success" onClick={addEducationRow}>
                                        Add Row +
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Required Documents */}
                    <div className="row mb-3">
                        <div className="col-sm-12">
                            <div className="card shadow mb-3">
                                <div className="card-header bg-light border-bottom-1 py-3">
                                    <h6 className="fw-bold mb-0">Required Documents</h6>
                                </div>
                                <div className="card-body">
                                    <table className="table table-bordered">
                                        <thead>
                                            <tr>
                                                <th>S.No</th>
                                                <th>Document Name</th>
                                                <th>File Upload</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formData.document.map((row, index) => (
                                                <tr key={index}>
                                                    <td>{index + 1}</td>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={row.documentName}
                                                            onChange={(e) => handleDocumentChange(index, "documentName", e.target.value)}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="file"
                                                            className="form-control"
                                                            onChange={(e) => handleDocumentChange(index, "filePath", e.target.files[0])}
                                                            accept=".pdf,.jpg,.jpeg,.png"
                                                        />
                                                    </td>
                                                    <td>
                                                        <button type="button" className="btn btn-danger" onClick={() => removeDocumentRow(index)}>
                                                            <i className="icofont-close"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <button type="button" className="btn btn-success" onClick={addDocumentRow}>
                                        Add Row +
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="d-flex justify-content-end mt-4">
                        <button
                            onClick={handleCreate}
                            type="button"
                            className="btn btn-secondary me-2"
                            disabled={loading}
                        >
                            {loading ? "Saving..." : "Save"}
                        </button>
                        <button
                            onClick={handleCreateWithApprove}
                            type="button"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? "Processing..." : "Save & Approve"}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default EmployeeRegistration;