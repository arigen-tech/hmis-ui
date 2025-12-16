import React, { useState, useEffect, useRef } from "react";
import { CKEditor } from '@ckeditor/ckeditor5-react';
import DecoupledEditor from '@ckeditor/ckeditor5-build-decoupled-document';
import placeholderImage from "../../../../assets/images/placeholder.jpg";
import { MAS_COUNTRY, MAS_DISTRICT, MAS_STATE, MAS_DEPARTMENT, MAS_GENDER, MAS_ROLES, MAS_IDENTIFICATION_TYPE, API_HOST, MAS_EMPLOYMENT_TYPE, MAS_USER_TYPE, EMPLOYEE_REGISTRATION } from "../../../../config/apiConfig";
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
        identificationType: "",
        registrationNo: "",
        employmentTypeId: "",
        employeeTypeId: "",
        roleId: "",
        fromDate: "",
        deprtId: "",

        qualification: [{ employeeQualificationId: 1, institutionName: "", completionYear: "", qualificationName: "", filePath: null }],
        document: [{ employeeDocumentId: 1, documentName: "", filePath: null }],
        // New sections
        specialtyCenter: [{ specialtyCenterId: 1, specialtyCenterName: "", centerId: "" }],
        workExperience: [{ experienceId: 1, organizationName: "" }],
        memberships: [{ membershipsId: 1, levelName: "" }],
        specialtyInterest: [{ interestId: 1, specialtyInterestName: "" }],
        awardsDistinction: [{ awardId: 1, awardName: "" }],
        profileDescription: "",
    };
    const [formData, setFormData] = useState(initialFormData);
    const [popup, setPopup] = useState("");
    const [popupMessage, setPopupMessage] = useState("");
    const [profileImage, setProfileImage] = useState(null);
    const [loading, setLoading] = useState(false);
    // Refs for CKEditor toolbar and editor instance for Profile Description
    const profileEditorRef = useRef(null);
    const profileInclusionRef = useRef(null);

    const handleProfileEditorChange = (event, editor) => {
        const data = editor.getData();
        setFormData(prev => ({ ...prev, profileDescription: data }));
    };
    const [departmentData, setDepartmentData] = useState([]);
    const [viewDept, setviewDept] = useState(false);
    const [countryData, setCountryData] = useState([]);
    const [stateData, setStateData] = useState([]);
    const [districtData, setDistrictData] = useState([]);
    const [genderData, setGenderData] = useState([]);
    const [idTypeData, setIdTypeData] = useState([]);
    const [roleData, setRoleData] = useState([]);
    const [employeeTypeData, setEmployeeTypeData] = useState([]);
    const [employmentTypeData, setEmploymentTypeData] = useState([]);
    const [specialtyCenterData, setSpecialtyCenterData] = useState([]);
    const [specialtySearch, setSpecialtySearch] = useState("");
    const [MAS_SPECIALITY_CENTER, setMAS_SPECIALITY_CENTER] = useState("masSpecialityCenter");

    const [countryIds, setCountryIds] = useState("");
    const [stateIds, setStateIds] = useState("");
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");

    const mlenght = 15;
    const today = new Date().toISOString().split("T")[0];

    useEffect(() => {
        fetchCountryData();
        fetchDepartmentData();
        fetchGenderData();
        fetchIdTypeData();
        fetchRoleData();
        fetchEmployeeTypeData();
        fetchEmploymentTypeData();
        fetchSpecialtyCenterData();
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

    // API Fetch Functions
    const fetchCountryData = async () => {
        setLoading(true);
        try {
            const data = await getRequest(`${MAS_COUNTRY}/getAll/1`);
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
            const data = await getRequest(`${MAS_DEPARTMENT}/getAll/1`);
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
            const GET_STATES = `${MAS_STATE}/getByCountryId/${countryIds}`;
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
            const GET_CITIES = `${MAS_DISTRICT}/getByState/${stateIds}`;
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
            const data = await getRequest(`${MAS_GENDER}/getAll/1`);
            if (data.status === 200 && Array.isArray(data.response)) {
                setGenderData(data.response);
            } else {
                console.error("Unexpected API response format:", data);
                setGenderData([]);
            }
        } catch (error) {
            console.error("Error fetching Gender data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchIdTypeData = async () => {
        setLoading(true);
        try {
            const data = await getRequest(`${MAS_IDENTIFICATION_TYPE}/getAll/1`);
            if (data.status === 200 && Array.isArray(data.response)) {
                setIdTypeData(data.response);
            } else {
                console.error("Unexpected API response format:", data);
                setIdTypeData([]);
            }
        } catch (error) {
            console.error("Error fetching IdType data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployeeTypeData = async () => {
        setLoading(true);
        try {
            const data = await getRequest(`${MAS_USER_TYPE}/getAll/1`);
            if (data.status === 200 && Array.isArray(data.response)) {
                setEmployeeTypeData(data.response);
            } else {
                console.error("Unexpected API response format:", data);
                setEmployeeTypeData([]);
            }
        } catch (error) {
            console.error("Error fetching EmployeeType data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmploymentTypeData = async () => {
        setLoading(true);
        try {
            const data = await getRequest(`${MAS_EMPLOYMENT_TYPE}/getAll/1`);
            if (data.status === 200 && Array.isArray(data.response)) {
                setEmploymentTypeData(data.response);
            } else {
                console.error("Unexpected API response format:", data);
                setEmploymentTypeData([]);
            }
        } catch (error) {
            console.error("Error fetching EmploymentType data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRoleData = async () => {
        setLoading(true);
        try {
            const data = await getRequest(`${MAS_ROLES}/getAll/1`);
            if (data.status === 200 && Array.isArray(data.response)) {
                setRoleData(data.response);
            } else {
                console.error("Unexpected API response format:", data);
                setRoleData([]);
            }
        } catch (error) {
            console.error("Error fetching Role data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSpecialtyCenterData = async () => {
        setLoading(true);
        try {
            const data = await getRequest(`${MAS_SPECIALITY_CENTER}/getAll/1`);
            if (data.status === 200 && Array.isArray(data.response)) {
                setSpecialtyCenterData(data.response);
            } else {
                console.error("Unexpected API response format:", data);
                setSpecialtyCenterData([]);
            }
        } catch (error) {
            console.error("Error fetching Specialty Center data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Filtered specialty centers based on search
    const filteredSpecialtyCenters = specialtyCenterData.filter(center =>
        center.centerName.toLowerCase().includes(specialtySearch.toLowerCase()) ||
        center.centerCode.toLowerCase().includes(specialtySearch.toLowerCase())
    );

    // Handler Functions
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

    const handleEmploymentTypeChange = (emptTypeId) => {
        setFormData((prevState) => ({
            ...prevState,
            employmentTypeId: emptTypeId,
        }));
    };

    const handleEmployeeTypeChange = (empTypeId) => {
        setFormData((prevState) => ({
            ...prevState,
            employeeTypeId: empTypeId,
        }));
    };

    const handleRoleChange = (role) => {
        setFormData((prevState) => ({
            ...prevState,
            roleId: role,
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

    const handleInputMobileChange = (e) => {
        const { id, value } = e.target;
        const numericValue = value.replace(/\D/g, '');
        setFormData((prevData) => ({ ...prevData, [id]: numericValue }));
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [id]: value }));
    };

    // Education Section
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

    // Document Section
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

    // Specialty Center Section
    const addSpecialtyCenterRow = () => {
        setFormData((prev) => ({
            ...prev,
            specialtyCenter: [
                ...prev.specialtyCenter,
                { id: prev.specialtyCenter.length + 1, specialtyCenterName: "", centerId: "" },
            ],
        }));
    };

    const removeSpecialtyCenterRow = (index) => {
        setFormData((prev) => ({
            ...prev,
            specialtyCenter: prev.specialtyCenter.filter((_, i) => i !== index),
        }));
    };

    // Work Experience Section
    const addWorkExperienceRow = () => {
        setFormData((prev) => ({
            ...prev,
            workExperience: [
                ...prev.workExperience,
                { experienceId: prev.workExperience.length + 1, organizationName: "" },
            ],
        }));
    };

    const removeWorkExperienceRow = (index) => {
        setFormData((prev) => ({
            ...prev,
            workExperience: prev.workExperience.filter((_, i) => i !== index),
        }));
    };

    // Designation Level Section
    const addmembershipsRow = () => {
        setFormData((prev) => ({
            ...prev,
            memberships: [
                ...prev.memberships,
                { membershipsId: prev.memberships.length + 1, levelName: "" },
            ],
        }));
    };

    const removemembershipsRow = (index) => {
        setFormData((prev) => ({
            ...prev,
            memberships: prev.memberships.filter((_, i) => i !== index),
        }));
    };

    // Specialty Interest Section
    const addSpecialtyInterestRow = () => {
        setFormData((prev) => ({
            ...prev,
            specialtyInterest: [
                ...prev.specialtyInterest,
                { interestId: prev.specialtyInterest.length + 1, specialtyInterestName: "" },
            ],
        }));
    };

    const removeSpecialtyInterestRow = (index) => {
        setFormData((prev) => ({
            ...prev,
            specialtyInterest: prev.specialtyInterest.filter((_, i) => i !== index),
        }));
    };

    // Awards & Distinctions Section
    const addAwardsDistinctionRow = () => {
        setFormData((prev) => ({
            ...prev,
            awardsDistinction: [
                ...prev.awardsDistinction,
                { awardId: prev.awardsDistinction.length + 1, awardName: "" },
            ],
        }));
    };

    const removeAwardsDistinctionRow = (index) => {
        setFormData((prev) => ({
            ...prev,
            awardsDistinction: prev.awardsDistinction.filter((_, i) => i !== index),
        }));
    };

    // Change Handlers for new sections
    const handleQualificationChange = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            qualification: prev.qualification.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        }));
    };

    const handleQualificationYearChange = (index, field, value) => {
        const numericValue = value.replace(/\D/g, '').slice(0, 4);
        setFormData(prev => ({
            ...prev,
            qualification: prev.qualification.map((item, i) =>
                i === index ? { ...item, [field]: numericValue } : item
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

    const handleSpecialtyCenterChange = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            specialtyCenter: prev.specialtyCenter.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        }));
    };

    const handleWorkExperienceChange = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            workExperience: prev.workExperience.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        }));
    };

    const handlemembershipsChange = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            memberships: prev.memberships.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        }));
    };

    const handleSpecialtyInterestChange = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            specialtyInterest: prev.specialtyInterest.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        }));
    };

    const handleAwardsDistinctionChange = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            awardsDistinction: prev.awardsDistinction.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        }));
    };

    // Form Validation
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

        // Basic Information
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
        // Profile description (rich text)
        formDataToSend.append('profileDescription', formData.profileDescription || '');
        formDataToSend.append('identificationType', formData.identificationType);
        formDataToSend.append('employeeTypeId', formData.employeeTypeId);
        formDataToSend.append('employmentTypeId', formData.employmentTypeId);
        formDataToSend.append('roleId', formData.roleId);
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

        // Specialty Center
        formData.specialtyCenter.forEach((center, index) => {
            formDataToSend.append(`specialtyCenter[${index}].specialtyCenterId`, center.specialtyCenterId || '');
            formDataToSend.append(`specialtyCenter[${index}].specialtyCenterName`, center.specialtyCenterName);
            formDataToSend.append(`specialtyCenter[${index}].centerId`, center.centerId);
        });

        // Work Experience (simplified)
        formData.workExperience.forEach((exp, index) => {
            formDataToSend.append(`workExperience[${index}].experienceId`, exp.experienceId || '');
            formDataToSend.append(`workExperience[${index}].organizationName`, exp.organizationName);
        });

        // Designation Level (simplified)
        formData.memberships.forEach((level, index) => {
            formDataToSend.append(`memberships[${index}].membershipsId`, level.membershipsId || '');
            formDataToSend.append(`memberships[${index}].levelName`, level.levelName);
        });

        // Specialty Interest (simplified)
        formData.specialtyInterest.forEach((interest, index) => {
            formDataToSend.append(`specialtyInterest[${index}].interestId`, interest.interestId || '');
            formDataToSend.append(`specialtyInterest[${index}].specialtyInterestName`, interest.specialtyInterestName);
        });

        // Awards & Distinctions (simplified)
        formData.awardsDistinction.forEach((award, index) => {
            formDataToSend.append(`awardsDistinction[${index}].awardId`, award.awardId || '');
            formDataToSend.append(`awardsDistinction[${index}].awardName`, award.awardName);
        });

        return formDataToSend;
    };

    const handleReset = () => {
        setFormData(initialFormData);

        // Reset profile image preview
        const profileImageInput = document.getElementById('profilePicName');
        if (profileImageInput) profileImageInput.value = '';

        // Reset ID document
        const idDocumentInput = document.getElementById('idDocumentName');
        if (idDocumentInput) idDocumentInput.value = '';

        // Reset all file inputs by their class name
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
            input.value = '';
        });

        // Reset form data with initial values
        setFormData({
            ...initialFormData,
            profilePicPreview: null,
            profilePicName: null,
            idDocumentName: null,
            qualification: [{
                employeeQualificationId: 1,
                institutionName: "",
                completionYear: "",
                qualificationName: "",
                filePath: null
            }],
            document: [{
                employeeDocumentId: 1,
                documentName: "",
                filePath: null
            }],
            specialtyCenter: [{
                specialtyCenterId: 1,
                specialtyCenterName: "",
                centerId: ""
            }],
            workExperience: [{ experienceId: 1, organizationName: "" }],
            memberships: [{ membershipsId: 1, levelName: "" }],
            specialtyInterest: [{ interestId: 1, specialtyInterestName: "" }],
            awardsDistinction: [{ awardId: 1, awardName: "" }]
        });

        // Reset file related states
        setProfileImage(null);

        // Clear CKEditor content if initialized
        if (profileEditorRef.current) {
            profileEditorRef.current.setData('');
        }
    };

    const handleCreate = async () => {
        const formDataToSend = prepareFormData();
        if (!formDataToSend) return;

        setLoading(true);
        try {
            const response = await fetch(`${API_HOST}/${EMPLOYEE_REGISTRATION}/create`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                body: formDataToSend
            });

            const data = await response.json();

            if (!response.ok || data.status === 500) {
                throw new Error(data.message || "Failed to create employee");
            }

            showPopup("Employee created successfully", "success");
            handleReset();

        } catch (error) {
            console.error("Error creating employee:", error);
            showPopup(error.message || "Error submitting form. Please try again.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateWithApprove = async () => {
        const formDataToSend = prepareFormData();
        if (!formDataToSend) return;

        if (!formData.deprtId) {
            setviewDept(true);
            showPopup("Department is required for approval. Please select a department.", "error");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_HOST}/${EMPLOYEE_REGISTRATION}/create-and-approve`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formDataToSend
            });

            const data = await response.json();

            if (!response.ok || data.status === 500) {
                throw new Error(data.message || `Failed with status: ${response.status}`);
            }

            showPopup("Employee created and approved successfully", "success");
            handleReset();

        } catch (error) {
            console.error("Error creating and approving employee:", error);
            showPopup(error.message || "Error creating and approving employee", "error");
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

                    {/* Employee Section */}
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
                                                            maxLength={mlenght}
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
                                                            maxLength={mlenght}
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
                                                            maxLength={mlenght}
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
                                                            placeholder="Address"
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
                                                            maxLength={mlenght}
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
                                                            onChange={handleInputMobileChange}
                                                            value={formData.pincode}
                                                            maxLength={6}
                                                            minLength={6}
                                                            inputMode="numeric"
                                                            pattern="\d*"
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
                                                            onChange={handleInputMobileChange}
                                                            value={formData.mobileNo}
                                                            maxLength={10}
                                                            minLength={10}
                                                            inputMode="numeric"
                                                            pattern="\d*"
                                                        />
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="form-label">ID Type
                                                            <span className="text-danger">*</span>
                                                        </label>
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
                                                            maxLength={mlenght}
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

                                                    <div className="col-md-4">
                                                        <label className="form-label">No. of experience</label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="No of experience"
                                                            maxLength={mlenght}
                                                        />
                                                    </div>



                                                    <div className="col-md-4">
                                                        <label className="form-label">Registration Number</label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="Registration Number"
                                                            maxLength={mlenght}
                                                        />
                                                    </div>



                                                    {viewDept && (
                                                        <div className="col-md-4">
                                                            <label className="form-label">Department Name *</label>
                                                            <select
                                                                className="form-select"
                                                                style={{ paddingRight: "40px" }}
                                                                value={formData.deprtId}
                                                                onChange={(e) =>
                                                                    handleDepartmentChange(parseInt(e.target.value, 10))
                                                                }
                                                                disabled={loading}
                                                            >
                                                                <option value="">Select Department</option>
                                                                {departmentData.map((depa) => (
                                                                    <option key={depa.id} value={depa.id}>
                                                                        {depa.departmentName}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    )}

                                                    <div className="col-md-4">
                                                        <label className="form-label">Employee Type *</label>
                                                        <select
                                                            className="form-select"
                                                            style={{ paddingRight: "40px" }}
                                                            value={formData.employeeTypeId}
                                                            onChange={(e) =>
                                                                handleEmployeeTypeChange(parseInt(e.target.value, 10))
                                                            }
                                                            disabled={loading}
                                                        >
                                                            <option value="">Select Employee Type</option>
                                                            {employeeTypeData.map((empType) => (
                                                                <option key={empType.userTypeId} value={empType.userTypeId}>
                                                                    {empType.userTypeName}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div className="col-md-4">
                                                        <label className="form-label">Designation </label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="Designation "
                                                            maxLength={mlenght}
                                                        />
                                                    </div>

                                                    <div className="col-md-4">
                                                        <label className="form-label">Employment Type *</label>
                                                        <select
                                                            className="form-select"
                                                            style={{ paddingRight: "40px" }}
                                                            value={formData.employmentTypeId}
                                                            onChange={(e) =>
                                                                handleEmploymentTypeChange(parseInt(e.target.value, 10))
                                                            }
                                                            disabled={loading}
                                                        >
                                                            <option value="">Select Employment Type</option>
                                                            {employmentTypeData.map((emptType) => (
                                                                <option key={emptType.id} value={emptType.id}>
                                                                    {emptType.employmentType}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div className="col-md-4">
                                                        <label className="form-label">Role *</label>
                                                        <select
                                                            className="form-select"
                                                            style={{ paddingRight: "40px" }}
                                                            value={formData.roleId}
                                                            onChange={(e) =>
                                                                handleRoleChange(parseInt(e.target.value, 10))
                                                            }
                                                            disabled={loading}
                                                        >
                                                            <option value="">Select Role</option>
                                                            {roleData.map((role) => (
                                                                <option key={role.id} value={role.id}>
                                                                    {role.roleDesc}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div className="col-md-4">
                                                        <label className="form-label">Period of Employment From Date</label>
                                                        <input
                                                            type="date"
                                                            id="fromDate"
                                                            value={formData.fromDate}
                                                            className="form-control"
                                                            onChange={handleInputChange}
                                                            min={today}
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

                                            <div className="col-md-12">
                                                <label className="form-label">Profile Description</label>
                                                <div className="form-group col-md-10">
                                                    <div className="form-label" style={{ border: '1px solid #ced4da', borderRadius: '6px', padding: '8px' }}>
                                                        <div ref={profileInclusionRef}></div>
                                                        <CKEditor
                                                            editor={DecoupledEditor}
                                                            data={formData.profileDescription}
                                                            config={{
                                                                toolbar: { shouldNotGroupWhenFull: true },
                                                                alignment: {
                                                                    options: ["left", "center", "right", "justify"],
                                                                },
                                                            }}
                                                            
                                                            onReady={(editor) => {
                                                                profileEditorRef.current = editor;
                                                                if (profileInclusionRef.current) {
                                                                    profileInclusionRef.current.inngerHTML = '';
                                                                    profileInclusionRef.current.appendChild(editor.ui.view.toolbar.element);
                                                                }
                                                            }}
                                                            onChange={handleProfileEditorChange}
                                                        />
                                                    </div>
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
                                                            placeholder="Degree"
                                                            onChange={(e) => handleQualificationChange(index, "qualificationName", e.target.value)}
                                                            maxLength={mlenght}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={row.institutionName}
                                                            placeholder="Institution Name"
                                                            onChange={(e) => handleQualificationChange(index, "institutionName", e.target.value)}
                                                            maxLength={mlenght}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="YYYY"
                                                            value={row.completionYear}
                                                            onChange={(e) => handleQualificationYearChange(index, "completionYear", e.target.value)}
                                                            maxLength={4}
                                                            minLength={4}
                                                            inputMode="numeric"
                                                            pattern="\d{4}"
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="file"
                                                            className="form-control"
                                                            data-index={index}
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

                    {/* Specialty Center Name */}
                    <div className="row mb-3">
                        <div className="col-sm-12">
                            <div className="card shadow mb-3">
                                <div className="card-header bg-light border-bottom-1 py-3">
                                    <h6 className="fw-bold mb-0">Specialty Center Name</h6>
                                </div>
                                <div className="card-body">
                                    <table className="table table-bordered">
                                        <thead>
                                            <tr>
                                                <th>S.No</th>
                                                <th>Specialty Center Name</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formData.specialtyCenter.map((row, index) => (
                                                <tr key={index}>
                                                    <td>{index + 1}</td>
                                                    <td>
                                                        <div className="position-relative">
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                value={row.specialtyCenterName}
                                                                placeholder="Search or enter specialty center"
                                                                onChange={(e) => {
                                                                    handleSpecialtyCenterChange(index, "specialtyCenterName", e.target.value);
                                                                    setSpecialtySearch(e.target.value);
                                                                }}
                                                                maxLength={mlenght}
                                                            />
                                                            {specialtySearch && (
                                                                <div className="dropdown-menu show w-100" style={{
                                                                    position: 'absolute',
                                                                    top: '100%',
                                                                    left: 0,
                                                                    zIndex: 1000,
                                                                    maxHeight: '200px',
                                                                    overflowY: 'auto'
                                                                }}>
                                                                    {filteredSpecialtyCenters.map(center => (
                                                                        <button
                                                                            key={center.centerId}
                                                                            type="button"
                                                                            className="dropdown-item"
                                                                            onClick={() => {
                                                                                handleSpecialtyCenterChange(index, "specialtyCenterName", center.centerName);
                                                                                handleSpecialtyCenterChange(index, "centerId", center.centerId);
                                                                                setSpecialtySearch("");
                                                                            }}
                                                                        >
                                                                            {center.centerName}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <button type="button" className="btn btn-danger" onClick={() => removeSpecialtyCenterRow(index)}>
                                                            <i className="icofont-close"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <button type="button" className="btn btn-success" onClick={addSpecialtyCenterRow}>
                                        Add Row +
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Work Experience */}
                    <div className="row mb-3">
                        <div className="col-sm-12">
                            <div className="card shadow mb-3">
                                <div className="card-header bg-light border-bottom-1 py-3">
                                    <h6 className="fw-bold mb-0">Work Experience</h6>
                                </div>
                                <div className="card-body">
                                    <table className="table table-bordered">
                                        <thead>
                                            <tr>
                                                <th>S.No</th>
                                                <th>Organization Name</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formData.workExperience.map((row, index) => (
                                                <tr key={index}>
                                                    <td>{index + 1}</td>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={row.organizationName}
                                                            placeholder="Organization Name"
                                                            onChange={(e) => handleWorkExperienceChange(index, "organizationName", e.target.value)}
                                                            maxLength={mlenght}
                                                        />
                                                    </td>
                                                    <td>
                                                        <button type="button" className="btn btn-danger" onClick={() => removeWorkExperienceRow(index)}>
                                                            <i className="icofont-close"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <button type="button" className="btn btn-success" onClick={addWorkExperienceRow}>
                                        Add Row +
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Designation Levels */}
                    <div className="row mb-3">
                        <div className="col-sm-12">
                            <div className="card shadow mb-3">
                                <div className="card-header bg-light border-bottom-1 py-3">
                                    <h6 className="fw-bold mb-0">Memberships</h6>
                                </div>
                                <div className="card-body">
                                    <table className="table table-bordered">
                                        <thead>
                                            <tr>
                                                <th>S.No</th>
                                                <th>Level Name</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formData.memberships.map((row, index) => (
                                                <tr key={index}>
                                                    <td>{index + 1}</td>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={row.levelName}
                                                            placeholder="Level Name"
                                                            onChange={(e) => handlemembershipsChange(index, "levelName", e.target.value)}
                                                            maxLength={mlenght}
                                                        />
                                                    </td>
                                                    <td>
                                                        <button type="button" className="btn btn-danger" onClick={() => removemembershipsRow(index)}>
                                                            <i className="icofont-close"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <button type="button" className="btn btn-success" onClick={addmembershipsRow}>
                                        Add Row +
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Specialty Interest */}
                    <div className="row mb-3">
                        <div className="col-sm-12">
                            <div className="card shadow mb-3">
                                <div className="card-header bg-light border-bottom-1 py-3">
                                    <h6 className="fw-bold mb-0">Specialty Interest</h6>
                                </div>
                                <div className="card-body">
                                    <table className="table table-bordered">
                                        <thead>
                                            <tr>
                                                <th>S.No</th>
                                                <th>Specialty Interest Name</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formData.specialtyInterest.map((row, index) => (
                                                <tr key={index}>
                                                    <td>{index + 1}</td>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={row.specialtyInterestName}
                                                            placeholder="Specialty Interest"
                                                            onChange={(e) => handleSpecialtyInterestChange(index, "specialtyInterestName", e.target.value)}
                                                            maxLength={mlenght}
                                                        />
                                                    </td>
                                                    <td>
                                                        <button type="button" className="btn btn-danger" onClick={() => removeSpecialtyInterestRow(index)}>
                                                            <i className="icofont-close"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <button type="button" className="btn btn-success" onClick={addSpecialtyInterestRow}>
                                        Add Row +
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Awards & Distinctions */}
                    <div className="row mb-3">
                        <div className="col-sm-12">
                            <div className="card shadow mb-3">
                                <div className="card-header bg-light border-bottom-1 py-3">
                                    <h6 className="fw-bold mb-0">Awards & Distinctions</h6>
                                </div>
                                <div className="card-body">
                                    <table className="table table-bordered">
                                        <thead>
                                            <tr>
                                                <th>S.No</th>
                                                <th>Award Name</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formData.awardsDistinction.map((row, index) => (
                                                <tr key={index}>
                                                    <td>{index + 1}</td>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={row.awardName}
                                                            placeholder="Award Name"
                                                            onChange={(e) => handleAwardsDistinctionChange(index, "awardName", e.target.value)}
                                                            maxLength={mlenght}
                                                        />
                                                    </td>
                                                    <td>
                                                        <button type="button" className="btn btn-danger" onClick={() => removeAwardsDistinctionRow(index)}>
                                                            <i className="icofont-close"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <button type="button" className="btn btn-success" onClick={addAwardsDistinctionRow}>
                                        Add Row +
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Required Documents (existing) */}
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
                                                            placeholder="Document Name"
                                                            maxLength={mlenght}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="file"
                                                            className="form-control"
                                                            data-index={index}
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
                            className="btn btn-primary me-2"
                            disabled={loading}
                        >
                            {loading ? "Submitting..." : "Submit"}
                        </button>
                        <button
                            onClick={handleCreateWithApprove}
                            type="button"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? "Processing..." : "Submit & Approve"}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default EmployeeRegistration;