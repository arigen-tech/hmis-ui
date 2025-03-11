import React, { useState, useEffect } from "react";
import placeholderImage from "../../../../assets/images/placeholder.jpg";
import { COUNTRYAPI, DISTRICTAPI, STATEAPI, GENDERAPI, API_HOST, EMPLOYEE } from "../../../../config/apiConfig";
import { getRequest, putRequest, postRequest } from "../../../../service/apiService";
import Popup from "../../../../Components/popup";
let EMPLOYEE_REGISTRATION = `${EMPLOYEE}/create`
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
        identificationType: 2,
        fromDate: "",

        qualification: [{ employeeQualificationId: 1, institutionName: "", completionYear: 0, qualificationName: "", filePath: null }],
        document: [{ employeeDocumentId: 1, documentName: "", filePath: null }],
    };
    const [formData, setFormData] = useState(initialFormData);
    const [popup, setPopup] = useState("");
    const [popupMessage, setPopupMessage] = useState("");
    const [profileImage, setProfileImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [countryData, setCountryData] = useState([]);
    const [stateData, setStateData] = useState([]);
    const [districtData, setDistrictData] = useState([]);
    const [genderData, setGenderData] = useState([]);
    const [idTypeData, setIdTypeData] = useState([]);
    const [countryIds, setCountryIds] = useState("");
    const [stateIds, setStateIds] = useState("");
    // const token = sessionStorage.getItem("token");
    const token = "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJhYmNAZ21haWwuY29tIiwiaG9zcGl0YWxJZCI6MSwiZW1wbG95ZWVJZCI6MSwiZXhwIjoxNzQyMjc1NDg0LCJ1c2VySWQiOjQsImlhdCI6MTc0MTY3MDY4NH0.8EEshDklEiZBRhDBKDzWvPsqHxUQ63mKpTxa1hBShpzghNga5Ie4YDpvdue1T9nlozXsvxySR3YNKnetvW9oEA";



    useEffect(() => {
        fetchCountryData();
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
            const data = await getRequest(`${COUNTRYAPI}/all`);
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
            const data = await getRequest(`${GENDERAPI}/all`);
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
            const GETALL = "/masterController/getAllHotelType";
            const data = await getRequest(GETALL);
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

    const handleIdTypeChange = (idTypeId) => {
        setFormData((prevState) => ({
            ...prevState,
            identificationType: idTypeId,
        }));
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [id]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];

        if (file) {
            const imageUrl = URL.createObjectURL(file);

            setProfileImage(imageUrl);
            setFormData((prevData) => ({
                ...prevData,
                profilePicName: file,
            }));
        }
    };

    const handleFileChange = (e) => {
        const { id, files } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [id]: files[0],
        }));
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

    const handleQualificationChange = (index, field, value) => {
        setFormData((prev) => {
            const updatedQualification = [...prev.qualification];
            updatedQualification[index][field] = value;
            return { ...prev, qualification: updatedQualification };
        });
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

    const handleDocumentChange = (index, field, value) => {
        setFormData((prev) => {
            const updatedDocuments = [...prev.document];
            updatedDocuments[index][field] = value;
            return { ...prev, document: updatedDocuments };
        });
    };

    // const handleSubmit = async (e) => {
    //     e.preventDefault();

    //     if (!formData.firstName || !formData.lastName || !formData.dob || !formData.mobileNo) {
    //         alert("Please fill in all required fields.");
    //         return;
    //     }

    //     const submissionData = new FormData();
    //     submissionData.append("firstName", formData.firstName);
    //     submissionData.append("middleName", formData.middleName);
    //     submissionData.append("lastName", formData.lastName);
    //     submissionData.append("dob", formData.dob);
    //     submissionData.append("genderId", formData.genderId);
    //     submissionData.append("address1", formData.address1);
    //     submissionData.append("countryId", formData.countryId);
    //     submissionData.append("stateId", formData.stateId);
    //     submissionData.append("districtId", formData.districtId);
    //     submissionData.append("city", formData.city);
    //     submissionData.append("pincode", formData.pincode);
    //     submissionData.append("mobileNo", formData.mobileNo);
    //     submissionData.append("registrationNo", formData.registrationNo);
    //     submissionData.append("identificationType", formData.identificationType);
    //     submissionData.append("fromDate", formData.fromDate);

    //     if (formData.profilePicName)
    //         submissionData.append("profilePicName", formData.profilePicName);
    //     if (formData.idDocumentName)
    //         submissionData.append("idDocumentName", formData.idDocumentName);

    //     formData.qualification.forEach((qual, index) => {
    //         submissionData.append(`qualification[${index}][employeeQualificationId]`, qual.employeeQualificationId);
    //         submissionData.append(`qualification[${index}][institutionName]`, qual.institutionName);
    //         submissionData.append(`qualification[${index}][completionYear]`, qual.completionYear);
    //         submissionData.append(`qualification[${index}][qualificationName]`, qual.qualificationName);
    //         submissionData.append(`qualification[${index}][filePath]`, qual.filePath);
    //     });

    //     formData.document.forEach((doc, index) => {
    //         submissionData.append(`document[${index}][employeeDocumentId]`, doc.employeeDocumentId);
    //         submissionData.append(`document[${index}][documentName]`, doc.documentName);
    //         submissionData.append(`document[${index}][filePath]`, doc.filePath);
    //     });

    //     try {
    //         const response = await fetch(`http://localhost:8080${EMPLOYEE}/employee`, {
    //             method: "POST",
    //             body: submissionData,
    //         });

    //         if (!response.ok) {
    //             throw new Error("Failed to submit form");
    //         }

    //         const responseData = await response.json();
    //         console.log("Form submitted successfully:", responseData);
    //         alert("Form submitted successfully!");

    //         setFormData(initialFormData);
    //     } catch (error) {
    //         console.error("Error submitting form:", error);
    //         alert("Error submitting form. Please try again.");
    //     }
    // };


    const handleSubmit = async (e) => {
        e.preventDefault();

        const formDataToSubmit = new FormData();

        formDataToSubmit.append("profilePicName", formData.profilePicName);
        formDataToSubmit.append("idDocumentName", formData.idDocumentName);
        formDataToSubmit.append("firstName", formData.firstName);
        formDataToSubmit.append("middleName", formData.middleName);
        formDataToSubmit.append("lastName", formData.lastName);
        formDataToSubmit.append("dob", formData.dob);
        formDataToSubmit.append("genderId", formData.genderId);
        formDataToSubmit.append("address1", formData.address1);
        formDataToSubmit.append("countryId", formData.countryId);
        formDataToSubmit.append("stateId", formData.stateId);
        formDataToSubmit.append("districtId", formData.districtId);
        formDataToSubmit.append("city", formData.city);
        formDataToSubmit.append("pincode", formData.pincode);
        formDataToSubmit.append("mobileNo", formData.mobileNo);
        formDataToSubmit.append("registrationNo", formData.registrationNo);
        formDataToSubmit.append("identificationType", formData.identificationType);
        formDataToSubmit.append("fromDate", formData.fromDate);

        // Append qualification details
        formData.qualification.forEach((qual, index) => {
            formDataToSubmit.append(`qualification[${index}][employeeQualificationId]`, qual.employeeQualificationId);
            formDataToSubmit.append(`qualification[${index}][institutionName]`, qual.institutionName);
            formDataToSubmit.append(`qualification[${index}][completionYear]`, qual.completionYear);
            formDataToSubmit.append(`qualification[${index}][qualificationName]`, qual.qualificationName);
            if (qual.filePath) {
                formDataToSubmit.append(`qualification[${index}][filePath]`, qual.filePath);
            }
        });

        // Append document details
        formData.document.forEach((doc, index) => {
            formDataToSubmit.append(`document[${index}][employeeDocumentId]`, doc.employeeDocumentId);
            formDataToSubmit.append(`document[${index}][documentName]`, doc.documentName);
            if (doc.filePath) {
                formDataToSubmit.append(`document[${index}][filePath]`, doc.filePath);
            }
        });

        try {
            setLoading(true);

            const response = await fetch(`${API_HOST}${EMPLOYEE_REGISTRATION}`, {
                method: "POST",
                body: formDataToSubmit,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to submit form: ${response.statusText}`);
            }

            const data = await response.json();
            showPopup(response?.message || "Form submitted successfully!", "success");
            // resetForm();
        } catch (error) {
            showPopup(
                error?.response?.message || "Failed to submit form. Please try again.",
                "error"
            );
            console.error("Form submission failed", error);
        } finally {
            setLoading(false);
        }
    };



    console.log("my data", formData);

    return (
        <>
            <div className="body d-flex py-3">
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
                            <div className="card-header py-3 bg-transparent d-flex align-items-center px-0 justify-content-between border-bottom flex-wrap">
                                <h3 className="fw-bold mb-0">Register of Employee</h3>
                            </div>
                        </div>
                    </div>

                    {/* employee Section */}
                    <div className="row mb-3">
                        <div className="col-sm-12">
                            <div className="card shadow mb-3">
                                <div className="card-header py-3 bg-light border-bottom-1">
                                    <h6 className="mb-0 fw-bold">Employee Registration</h6>
                                </div>
                                <div className="card-body">
                                    <form>
                                        <div className="row g-3">
                                            <div className="col-md-9">
                                                <div className="row g-3">
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
                                                            required
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
                                                                <option key={idType.id} value={idType.id}>
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
                                                            required
                                                            id="idDocumentName"
                                                            className="form-control"
                                                            accept=".jpg,.jpeg,.png,.pdf"
                                                            onChange={handleFileChange}
                                                        />

                                                    </div>

                                                    <div className="col-md-4">
                                                        <label className="form-label">Period of Employment From Date</label>
                                                        <input
                                                            type="date"
                                                            required
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
                                                <div className="border p-2 d-flex flex-column align-items-center">
                                                    <img
                                                        src={profileImage || placeholderImage}
                                                        alt="Profile"
                                                        className="img-fluid"
                                                        style={{ objectFit: "cover" }}
                                                    />
                                                    <input
                                                        type="file"
                                                        className="form-control mt-2"
                                                        accept="image/*"
                                                        onChange={handleImageChange}
                                                        required
                                                        id="profilePicName"
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
                                <div className="card-header py-3 bg-light border-bottom-1">
                                    <h6 className="mb-0 fw-bold">Educational Qualification</h6>
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
                                <div className="card-header py-3 bg-light border-bottom-1">
                                    <h6 className="mb-0 fw-bold">Required Documents</h6>
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

                    <div className="mt-4 d-flex justify-content-end">
                        <button type="reset" className="btn btn-secondary me-2">Save</button>
                        <button onClick={handleSubmit} type="submit" className="btn btn-primary">Submit</button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default EmployeeRegistration;
