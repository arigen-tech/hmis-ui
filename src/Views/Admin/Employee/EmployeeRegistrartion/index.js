import React, { useState, useEffect, useRef } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import DecoupledEditor from "@ckeditor/ckeditor5-build-decoupled-document";
import placeholderImage from "../../../../assets/images/placeholder.jpg";
import {
  MAS_COUNTRY,
  MAS_DISTRICT,
  MAS_STATE,
  MAS_DEPARTMENT,
  MAS_GENDER,
  MAS_ROLES,
  MAS_IDENTIFICATION_TYPE,
  API_HOST,
  MAS_EMPLOYMENT_TYPE,
  MAS_USER_TYPE,
  EMPLOYEE_REGISTRATION,
  MAS_DESIGNATION,
  MAS_SPECIALITY_CENTER,
  MAS_LANGUAGES,
  CREATE_EMPLOYEE,
  CREATE_APPROVE_EMPLOYEE,
} from "../../../../config/apiConfig";

import { getRequest ,postRequestWithFormData  } from "../../../../service/apiService";
import LoadingScreen from "../../../../Components/Loading";
import Popup from "../../../../Components/popup";
import validateUploadedFile from "../../../../Components/FileSize";

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
    registrationNumber: "",

    employmentTypeId: "",
    employeeTypeId: "",
    roleId: "",
    fromDate: "",
    departmentId: "",
    designationId: "",
    totalExperience: "",
    qualifications: "",
    medicalRegistrationNo: "",
    languages: [{ languageId: 1, languageName: "", languageIdValue: "" }],

    qualification: [
      {
        employeeQualificationId: 1,
        institutionName: "",
        completionYear: "",
        qualificationName: "",
        filePath: null,
      },
    ],
    document: [{ employeeDocumentId: 1, documentName: "", filePath: null }],
    // New sections
    specialtyCenter: [
      { specialtyCenterId: 1, specialtyCenterName: "", centerId: "" },
    ],
    workExperiences: [{ experienceId: 1, organizationName: "" }],
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
    setFormData((prev) => ({ ...prev, profileDescription: data }));
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
  const [specialtySearch, setSpecialtySearch] = useState(null);
  const [selectedDesignationId, setSelectedDesignationId] = useState("");
  const [designationData, setDesignationData] = useState([]);
  const [designationLoading, setDesignationLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [languageData, setLanguageData] = useState([]);

  const [countryIds, setCountryIds] = useState("");
  const [stateIds, setStateIds] = useState("");
  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");
  const [previewModal, setPreviewModal] = useState({
    show: false,
    type: "",
    url: "",
    fileName: "",
    section: "",
  });

  const mlenght = 20;
  const plength = 50;
  const today = new Date().toISOString().split("T")[0];
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 2);
  const maxDateStr = maxDate.toISOString().split("T")[0];

  useEffect(() => {
    fetchCountryData();
    // fetchDepartmentData();
    fetchGenderData();
    fetchIdTypeData();
    fetchRoleData();
    fetchEmployeeTypeData();
    fetchEmploymentTypeData();
    fetchSpecialtyCenterData();
    fetchLanguageData();
  }, []);

  const clearFieldError = (field) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
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

  const validateAllFilesBeforeSubmit = () => {
    const allFiles = [];

    // Collect all files
    if (formData.profilePicName instanceof File) {
      allFiles.push({ file: formData.profilePicName, name: "Profile image" });
    }

    if (formData.idDocumentName instanceof File) {
      allFiles.push({ file: formData.idDocumentName, name: "ID document" });
    }

    formData.qualification.forEach((qual, index) => {
      if (qual.filePath instanceof File) {
        allFiles.push({
          file: qual.filePath,
          name: `Qualification #${index + 1}: ${qual.qualificationName || "Unknown"}`,
        });
      }
    });

    formData.document.forEach((doc, index) => {
      if (doc.filePath instanceof File) {
        allFiles.push({
          file: doc.filePath,
          name: `Document #${index + 1}: ${doc.documentName || "Unknown"}`,
        });
      }
    });

    // Validate each file using the imported function
    for (const { file, name } of allFiles) {
      const validation = validateUploadedFile(file, name);
      if (!validation.isValid) {
        showPopup(validation.error, "error");
        return false;
      }
    }

    return true;
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

  const fetchLanguageData = async () => {
    setLoading(true);
    try {
      const data = await getRequest(`${MAS_LANGUAGES}/getAll/1`);
      console.log("Language Data:", data);

      if (data && data.status === 200 && Array.isArray(data.response)) {
        const formattedLanguages = data.response.map((lang) => ({
          id: lang.id,
          languageName: lang.language,
          language: lang.language,
        }));
        setLanguageData(formattedLanguages);
        console.log("Languages loaded:", formattedLanguages.length);
      } else {
        console.error("Unexpected API response format:", data);
        setLanguageData([]);
      }
    } catch (error) {
      console.error("Error fetching languages:", error);
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

  const fetchDesignationByEmpTypeData = async (employeeTypeId) => {
    if (!employeeTypeId) {
      setDesignationData([]);
      setSelectedDesignationId("");
      return;
    }

    setDesignationLoading(true);
    try {
      const data = await getRequest(
        `${MAS_DESIGNATION}/getById/${employeeTypeId}`,
      );

      if (data && data.status === 200 && Array.isArray(data.response)) {
        setDesignationData(data.response);
      } else {
        console.error("Unexpected API response format:", data);
        setDesignationData([]);
        showPopup("Failed to fetch designations. Please try again.", "error");
      }
    } catch (error) {
      console.error("Error fetching Designation data:", error);
      setDesignationData([]);
      showPopup("Failed to fetch designations. Please try again.", "error");
    } finally {
      setDesignationLoading(false);
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

      console.log("Specialty Center Data:", data);

      if (data && data.status === 200 && Array.isArray(data.response)) {
        setSpecialtyCenterData(data.response);
        console.log("Specialty centers loaded:", data.response.length);
      } else {
        console.error("Unexpected API response format:", data);
        setSpecialtyCenterData([]);
      }
    } catch (error) {
      console.error("Error fetching specialty centers:", error);
      showPopup("Failed to load specialty centers", "error");
    } finally {
      setLoading(false);
    }
  };

  // Filtered specialty centers based on search
  const filteredSpecialtyCenters =
    specialtySearch && specialtySearch.value
      ? specialtyCenterData.filter((center) => {
          const centerName = (
            center.centerName ||
            center.specialtyCenterName ||
            ""
          ).toLowerCase();
          const centerCode = (center.centerCode || "").toLowerCase();
          const searchTerm = specialtySearch.value.toLowerCase();

          return (
            centerName.includes(searchTerm) || centerCode.includes(searchTerm)
          );
        })
      : [];

  const handleCountryChange = (countryCode, id) => {
    setFormData((prevState) => ({
      ...prevState,
      countryId: id,
      stateId: "",
      districtId: "",
    }));
    clearFieldError("countryId");
    clearFieldError("stateId");
    clearFieldError("districtId");
  };

  const removeLanguageRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index),
    }));
  };

  const handleStateChange = (stateCode, id) => {
    setFormData((prevState) => ({
      ...prevState,
      stateId: id,
      districtId: "",
    }));
    clearFieldError("stateId");
    clearFieldError("districtId");
    fetchDistrictData(stateCode);
  };

  const handleDistrictChange = (districtId) => {
    setFormData((prevState) => ({
      ...prevState,
      districtId: districtId,
    }));
    clearFieldError("districtId");
  };

  const handleLanguageChange = (
    index,
    field,
    value,
    selectedLanguage = null,
  ) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: value,
              ...(field === "languageName" && selectedLanguage
                ? { languageIdValue: selectedLanguage }
                : {}),
            }
          : item,
      ),
    }));
    clearArrayFieldError("languages", index, field);
  };

  const handleGenderChange = (gendersId) => {
    setFormData((prevState) => ({
      ...prevState,
      genderId: gendersId,
    }));
    clearFieldError("genderId");
  };

  const handleDepartmentChange = (departmentId) => {
    setFormData((prevState) => ({
      ...prevState,
      departmentId: departmentId,
    }));
  };

  const handleEmploymentTypeChange = (emptTypeId) => {
    setFormData((prevState) => ({
      ...prevState,
      employmentTypeId: emptTypeId,
    }));
    clearFieldError("employmentTypeId");
  };

  const handleEmployeeTypeChange = (empTypeId) => {
    setFormData((prevState) => ({
      ...prevState,
      employeeTypeId: empTypeId,
      designationId: "",
    }));
    clearFieldError("employeeTypeId");
    clearFieldError("designationId");

    setDesignationData([]);
    setSelectedDesignationId("");

    if (empTypeId) {
      fetchDesignationByEmpTypeData(empTypeId);
    }
  };

  const handleDesignationChange = (designationId) => {
    setSelectedDesignationId(designationId);
    setFormData((prevState) => ({
      ...prevState,
      designationId: designationId,
    }));
    clearFieldError("designationId");
  };

  const handleRoleChange = (role) => {
    setFormData((prevState) => ({
      ...prevState,
      roleId: role,
    }));
    clearFieldError("roleId");
  };

  const handleIdTypeChange = (idTypeId) => {
    setFormData((prevState) => ({
      ...prevState,
      identificationType: idTypeId,
    }));
    clearFieldError("identificationType");
  };

  const handleInputMobileChange = (e) => {
    const { id, value } = e.target;
    const numericValue = value.replace(/\D/g, "");
    setFormData((prevData) => ({ ...prevData, [id]: numericValue }));
    clearFieldError(id);
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));
    clearFieldError(id);
  };

  const openPreview = (url, type, fileName, section) => {
    setPreviewModal({
      show: true,
      type,
      url,
      fileName,
      section,
    });
  };

  // Function to close preview
  const closePreview = () => {
    setPreviewModal({
      show: false,
      type: "",
      url: "",
      fileName: "",
      section: "",
    });
  };

  const addLanguageRow = () => {
    setFormData((prev) => ({
      ...prev,
      languages: [
        ...prev.languages,
        {
          languageId: prev.languages.length + 1,
          languageName: "",
          languageIdValue: "",
        },
      ],
    }));
  };

  const addEducationRow = (e) => {
    e.preventDefault();
    setFormData((prev) => ({
      ...prev,
      qualification: [
        ...prev.qualification,
        {
          employeeQualificationId: prev.qualification.length + 1,
          institutionName: "",
          completionYear: "",
          qualificationName: "",
          filePath: null,
        },
      ],
    }));
  };

  const removeEducationRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      qualification: prev.qualification
        .filter((_, i) => i !== index)
        .map((item, newIndex) => ({
          ...item,
          employeeQualificationId: newIndex + 1,
        })),
    }));
  };

  // Document Section
  const addDocumentRow = () => {
    setFormData((prev) => ({
      ...prev,
      document: [
        ...prev.document,
        {
          employeeDocumentId: prev.document.length + 1,
          documentName: "",
          filePath: null,
        },
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
        {
          specialtyCenterId: prev.specialtyCenter.length + 1,
          specialtyCenterName: "",
          centerId: "",
        },
      ],
    }));
    setSpecialtySearch(null); // Reset search when adding new row
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
      workExperiences: [
        ...prev.workExperiences,
        { experienceId: prev.workExperiences.length + 1, organizationName: "" },
      ],
    }));
  };

  const removeWorkExperienceRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      workExperiences: prev.workExperiences.filter((_, i) => i !== index),
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
        {
          interestId: prev.specialtyInterest.length + 1,
          specialtyInterestName: "",
        },
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
    setFormData((prev) => ({
      ...prev,
      qualification: prev.qualification.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
    clearArrayFieldError("qualification", index, field);
  };

  const handleQualificationYearChange = (index, field, value) => {
    const numericValue = value.replace(/\D/g, "").slice(0, 4);
    setFormData((prev) => ({
      ...prev,
      qualification: prev.qualification.map((item, i) =>
        i === index ? { ...item, [field]: numericValue } : item,
      ),
    }));
  };

  const handleSpecialtyCenterChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      specialtyCenter: prev.specialtyCenter.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
    clearArrayFieldError("specialtyCenter", index, field);

    if (field === "specialtyCenterName") {
      setSpecialtySearch(value);
    }
  };

  const handleWorkExperienceChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      workExperiences: prev.workExperiences.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
    clearArrayFieldError("workExperiences", index, field);
  };

  const handlemembershipsChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      memberships: prev.memberships.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
    clearArrayFieldError("memberships", index, field);
  };

  const handleSpecialtyInterestChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      specialtyInterest: prev.specialtyInterest.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
    clearArrayFieldError("specialtyInterest", index, field);
  };

  const handleAwardsDistinctionChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      awardsDistinction: prev.awardsDistinction.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
    clearArrayFieldError("awardsDistinction", index, field);
  };

  const handleDocumentChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      document: prev.document.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
    clearArrayFieldError("document", index, field);
  };

  // Form Validation
  const validateForm = () => {
    const newErrors = {};

    // Basic fields validation
    const basicFields = [
      { field: "firstName", message: "First Name is required" },
      { field: "lastName", message: "Last Name is required" },
      { field: "dob", message: "Date of Birth is required" },
      { field: "genderId", message: "Gender is required" },
      { field: "address1", message: "Address is required" },
      { field: "countryId", message: "Country is required" },
      { field: "stateId", message: "State is required" },
      { field: "districtId", message: "District is required" },
      { field: "city", message: "City is required" },
      { field: "pincode", message: "Pincode is required" },
      { field: "mobileNo", message: "Mobile Number is required" },
      { field: "identificationType", message: "ID Type is required" },
      { field: "registrationNo", message: "ID Number is required" },
      {
        field: "registrationNumber",
        message: "Registration Number is required",
      },
      { field: "employmentTypeId", message: "Employment Type is required" },
      { field: "employeeTypeId", message: "Employee Type is required" },
      { field: "roleId", message: "Role is required" },
      { field: "designationId", message: "Designation is required" },
      { field: "totalExperience", message: "Total Experience is required" },
      { field: "qualifications", message: "Qualifications is required" },
      {
        field: "profileDescription",
        message: "Profile Description is required",
      },

      {
        field: "medicalRegistrationNo",
        message: "Medical Registration Number is required",
      },
    ];

    basicFields.forEach(({ field, message }) => {
      if (!formData[field] || formData[field].toString().trim() === "") {
        newErrors[field] = message;
      }
    });

    // Department validation (conditional)
    if (
      viewDept &&
      (!formData.departmentId || formData.departmentId.toString().trim() === "")
    ) {
      newErrors.departmentId = "Department is required";
    }

    // Profile Image validation
    if (
      !formData.profilePicName ||
      !(formData.profilePicName instanceof File)
    ) {
      newErrors.profilePicName = "Profile Image is required";
    } else {
      const profileValidation = validateUploadedFile(
        formData.profilePicName,
        "Profile image",
      );
      if (!profileValidation.isValid) {
        newErrors.profilePicName = profileValidation.error;
      }
    }

    // ID Document validation
    if (
      !formData.idDocumentName ||
      !(formData.idDocumentName instanceof File)
    ) {
      newErrors.idDocumentName = "ID Document is required";
    } else {
      const idValidation = validateUploadedFile(
        formData.idDocumentName,
        "ID document",
      );
      if (!idValidation.isValid) {
        newErrors.idDocumentName = idValidation.error;
      }
    }

    // Phone number format validation
    if (formData.mobileNo) {
      if (formData.mobileNo.length !== 10) {
        newErrors.mobileNo = "Mobile number must be 10 digits";
      }
    }

    // Pincode validation
    if (formData.pincode && formData.pincode.length !== 6) {
      newErrors.pincode = "Pincode must be 6 digits";
    }

    // Qualification validation
    const qualificationErrors = [];
    formData.qualification.forEach((qual, index) => {
      const qualErrors = {};
      if (!qual.qualificationName || qual.qualificationName.trim() === "") {
        qualErrors.qualificationName = "Degree is required";
      }
      if (!qual.institutionName || qual.institutionName.trim() === "") {
        qualErrors.institutionName = "Institution Name is required";
      }
      if (
        !qual.completionYear ||
        qual.completionYear.trim() === "" ||
        qual.completionYear.length !== 4
      ) {
        qualErrors.completionYear =
          "Valid Year of Completion is required (YYYY)";
      }
      if (!qual.filePath || !(qual.filePath instanceof File)) {
        qualErrors.filePath = "Qualification file is required";
      } else {
        const fileValidation = validateUploadedFile(
          qual.filePath,
          `Qualification #${index + 1}`,
        );
        if (!fileValidation.isValid) {
          qualErrors.filePath = fileValidation.error;
        }
      }
      if (Object.keys(qualErrors).length > 0) {
        qualificationErrors[index] = qualErrors;
      }
    });
    if (qualificationErrors.length > 0) {
      newErrors.qualification = qualificationErrors;
    }

    // Specialty Center Validation
    const specialtyCenterErrors = [];
    formData.specialtyCenter.forEach((center, index) => {
      const centerErrors = {};
      if (
        !center.specialtyCenterName ||
        center.specialtyCenterName.toString().trim() === ""
      ) {
        centerErrors.specialtyCenterName = "Specialty Center Name is required";
      }
      if (!center.centerId || center.centerId.toString().trim() === "") {
        centerErrors.centerId = "Center ID is required";
      }
      if (Object.keys(centerErrors).length > 0) {
        specialtyCenterErrors[index] = centerErrors;
      }
    });
    if (specialtyCenterErrors.length > 0) {
      newErrors.specialtyCenter = specialtyCenterErrors;
    }

    // Language Validation
    const languageErrors = [];
    formData.languages.forEach((language, index) => {
      const langErrors = {};
      if (
        !language.languageName ||
        language.languageName.toString().trim() === ""
      ) {
        langErrors.languageName = "Language is required";
      }
      if (
        !language.languageIdValue ||
        language.languageIdValue.toString().trim() === ""
      ) {
        langErrors.languageIdValue = "Language ID is required";
      }
      if (Object.keys(langErrors).length > 0) {
        languageErrors[index] = langErrors;
      }
    });
    if (languageErrors.length > 0) {
      newErrors.languages = languageErrors;
    }

    // Work Experience Validation
    const workExperienceErrors = [];
    formData.workExperiences.forEach((exp, index) => {
      const expErrors = {};
      if (!exp.organizationName || exp.organizationName.trim() === "") {
        expErrors.organizationName = "Work Experience details are required";
      }
      if (Object.keys(expErrors).length > 0) {
        workExperienceErrors[index] = expErrors;
      }
    });
    if (workExperienceErrors.length > 0) {
      newErrors.workExperiences = workExperienceErrors;
    }

    // Memberships Validation
    const membershipErrors = [];
    formData.memberships.forEach((member, index) => {
      const memberErrors = {};
      if (!member.levelName || member.levelName.trim() === "") {
        memberErrors.levelName = "Membership details are required";
      }
      if (Object.keys(memberErrors).length > 0) {
        membershipErrors[index] = memberErrors;
      }
    });
    if (membershipErrors.length > 0) {
      newErrors.memberships = membershipErrors;
    }

    // Specialty Interest Validation
    const specialtyInterestErrors = [];
    formData.specialtyInterest.forEach((interest, index) => {
      const interestErrors = {};
      if (
        !interest.specialtyInterestName ||
        interest.specialtyInterestName.trim() === ""
      ) {
        interestErrors.specialtyInterestName = "Specialty Interest is required";
      }
      if (Object.keys(interestErrors).length > 0) {
        specialtyInterestErrors[index] = interestErrors;
      }
    });
    if (specialtyInterestErrors.length > 0) {
      newErrors.specialtyInterest = specialtyInterestErrors;
    }

    // Awards & Distinctions Validation
    const awardsErrors = [];
    formData.awardsDistinction.forEach((award, index) => {
      const awardErrors = {};
      if (!award.awardName || award.awardName.trim() === "") {
        awardErrors.awardName = "Award Name is required";
      }
      if (Object.keys(awardErrors).length > 0) {
        awardsErrors[index] = awardErrors;
      }
    });
    if (awardsErrors.length > 0) {
      newErrors.awardsDistinction = awardsErrors;
    }

    // Documents Validation
    const documentErrors = [];
    formData.document.forEach((doc, index) => {
      const docErrors = {};
      if (!doc.documentName || doc.documentName.trim() === "") {
        docErrors.documentName = "Document Name is required";
      }
      if (!doc.filePath || !(doc.filePath instanceof File)) {
        docErrors.filePath = "Document file is required";
      } else {
        const fileValidation = validateUploadedFile(
          doc.filePath,
          `Document #${index + 1}`,
        );
        if (!fileValidation.isValid) {
          docErrors.filePath = fileValidation.error;
        }
      }
      if (Object.keys(docErrors).length > 0) {
        documentErrors[index] = docErrors;
      }
    });
    if (documentErrors.length > 0) {
      newErrors.document = documentErrors;
    }

    // Set errors
    setErrors(newErrors);

    // Return first error for popup
    if (Object.keys(newErrors).length > 0) {
      // Find the first error message
      let firstErrorMessage = "";
      let firstErrorField = "";

      for (const [key, value] of Object.entries(newErrors)) {
        if (typeof value === "string") {
          firstErrorMessage = value;
          firstErrorField = key;
          break;
        } else if (Array.isArray(value)) {
          for (const [index, errorObj] of value.entries()) {
            if (errorObj && typeof errorObj === "object") {
              const firstFieldError = Object.values(errorObj)[0];
              if (firstFieldError) {
                firstErrorMessage = firstFieldError;
                firstErrorField = `${key}[${index}]`;
                break;
              }
            }
          }
          if (firstErrorMessage) break;
        }
      }

      if (firstErrorMessage) {
        showPopup(firstErrorMessage, "error");

        // Scroll to the error field
        setTimeout(() => {
          const errorElements = document.querySelectorAll(".is-invalid");
          if (errorElements.length > 0) {
            errorElements[0].scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
            errorElements[0].focus();
          }
        }, 100);
      }

      return false;
    }

    return true;
  };

  // Helper function to check if a field has error
  const hasError = (section, index, field) => {
    if (!errors[section]) return false;
    if (Array.isArray(errors[section])) {
      return errors[section][index] && errors[section][index][field];
    }
    return errors[section][field];
  };

  // Helper function to get error message
  const getErrorMessage = (section, index, field) => {
    if (!errors[section]) return "";
    if (Array.isArray(errors[section])) {
      return errors[section][index] && errors[section][index][field];
    }
    return errors[section][field];
  };

  // Update isFormValid function to check all sections
  const isFormValid = () => {
    // Check basic fields
    const requiredFields = [
      "firstName",
      "lastName",
      "dob",
      "genderId",
      "address1",
      "countryId",
      "stateId",
      "districtId",
      "city",
      "pincode",
      "mobileNo",
      "identificationType",
      "registrationNo",
      "registrationNumber",
      "employeeTypeId",
      "designationId",
      "employmentTypeId",
      "roleId",
      "totalExperience",
      "qualifications",
      "profileDescription",
      "medicalRegistrationNo",
    ];

    if (viewDept) {
      requiredFields.push("departmentId");
    }

    // Check files
    const filesValid =
      formData.profilePicName instanceof File &&
      formData.idDocumentName instanceof File;

    // Check arrays
    const qualificationValid =
      formData.qualification.length > 0 &&
      formData.qualification.every(
        (qual) =>
          qual.qualificationName &&
          qual.institutionName &&
          qual.completionYear &&
          qual.completionYear.length === 4 &&
          qual.filePath instanceof File,
      );

    const languagesValid =
      formData.languages.length > 0 &&
      formData.languages.every(
        (lang) =>
          lang.languageName &&
          lang.languageName.trim() !== "" &&
          lang.languageIdValue &&
          lang.languageIdValue.toString().trim() !== "",
      );

    const specialtyCenterValid =
      formData.specialtyCenter.length > 0 &&
      formData.specialtyCenter.every(
        (center) =>
          center.specialtyCenterName &&
          center.specialtyCenterName.trim() !== "" &&
          center.centerId &&
          center.centerId.toString().trim() !== "",
      );

    const workExperienceValid =
      formData.workExperiences.length > 0 &&
      formData.workExperiences.every(
        (exp) => exp.organizationName && exp.organizationName.trim() !== "",
      );

    const membershipValid =
      formData.memberships.length > 0 &&
      formData.memberships.every(
        (member) => member.levelName && member.levelName.trim() !== "",
      );

    const specialtyInterestValid =
      formData.specialtyInterest.length > 0 &&
      formData.specialtyInterest.every(
        (interest) =>
          interest.specialtyInterestName &&
          interest.specialtyInterestName.trim() !== "",
      );

    const awardsValid =
      formData.awardsDistinction.length > 0 &&
      formData.awardsDistinction.every(
        (award) => award.awardName && award.awardName.trim() !== "",
      );

    const documentsValid =
      formData.document.length > 0 &&
      formData.document.every(
        (doc) =>
          doc.documentName &&
          doc.documentName.trim() !== "" &&
          doc.filePath instanceof File,
      );

    const basicFieldsValid = requiredFields.every(
      (field) => formData[field] && formData[field].toString().trim() !== "",
    );

    // Phone and pincode validation
    const mobileValid = formData.mobileNo && formData.mobileNo.length === 10;
    const pincodeValid = formData.pincode && formData.pincode.length === 6;

    return (
      basicFieldsValid &&
      filesValid &&
      qualificationValid &&
      languagesValid &&
      specialtyCenterValid &&
      workExperienceValid &&
      membershipValid &&
      specialtyInterestValid &&
      awardsValid &&
      documentsValid &&
      mobileValid &&
      pincodeValid
    );
  };

  const handleFileWithPreview = (e, section, index = null) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileNameMap = {
      profile: "Profile image",
      idDocument: "ID document",
      qualification: "Qualification file",
      document: "Document file",
    };

    const fileName = fileNameMap[section] || "File";

    const validation = validateUploadedFile(file, fileName);
    if (!validation.isValid) {
      showPopup(validation.error, "error");
      e.target.value = "";
      return;
    }

    // Clear previous errors for this section
    if (section === "profile") {
      clearFieldError("profilePicName");
    } else if (section === "idDocument") {
      clearFieldError("idDocumentName");
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      switch (section) {
        case "profile":
          setFormData((prev) => ({
            ...prev,
            profilePicName: file,
            profilePicPreview: reader.result,
            profilePicType: file.type,
          }));
          break;

        case "idDocument":
          setFormData((prev) => ({
            ...prev,
            idDocumentName: file,
            idDocumentPreview: reader.result,
            idDocumentType: file.type,
          }));
          break;

        case "qualification":
          setFormData((prev) => ({
            ...prev,
            qualification: prev.qualification.map((item, i) =>
              i === index
                ? {
                    ...item,
                    filePath: file,
                    filePreview: reader.result,
                    fileName: file.name,
                    fileType: file.type,
                  }
                : item,
            ),
          }));
          // Clear qualification errors for this index
          if (errors.qualification && Array.isArray(errors.qualification)) {
            setErrors((prev) => {
              const newErrors = { ...prev };
              if (newErrors.qualification && newErrors.qualification[index]) {
                delete newErrors.qualification[index];
                if (Object.keys(newErrors.qualification).length === 0) {
                  delete newErrors.qualification;
                }
              }
              return newErrors;
            });
          }
          break;

        case "document":
          setFormData((prev) => ({
            ...prev,
            document: prev.document.map((item, i) =>
              i === index
                ? {
                    ...item,
                    filePath: file,
                    filePreview: reader.result,
                    fileName: file.name,
                    fileType: file.type,
                  }
                : item,
            ),
          }));
          // Clear document errors for this index
          if (errors.document && Array.isArray(errors.document)) {
            setErrors((prev) => {
              const newErrors = { ...prev };
              if (newErrors.document && newErrors.document[index]) {
                delete newErrors.document[index];
                if (Object.keys(newErrors.document).length === 0) {
                  delete newErrors.document;
                }
              }
              return newErrors;
            });
          }
          break;

        default:
          break;
      }
    };
    reader.readAsDataURL(file);
  };

  const clearArrayFieldError = (section, index, field) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      if (
        newErrors[section] &&
        Array.isArray(newErrors[section]) &&
        newErrors[section][index]
      ) {
        delete newErrors[section][index][field];
        if (Object.keys(newErrors[section][index]).length === 0) {
          delete newErrors[section][index];
        }
        if (
          newErrors[section].every(
            (item) => item === null || item === undefined,
          )
        ) {
          delete newErrors[section];
        }
      }
      return newErrors;
    });
  };

  const prepareFormData = () => {
    if (!validateForm()) {
      return null;
    }

    const formDataToSend = new FormData();

    // 1. Basic Information - Ensure correct data types
    formDataToSend.append("firstName", formData.firstName);
    formDataToSend.append("lastName", formData.lastName);
    formDataToSend.append("middleName", formData.middleName || "");
    formDataToSend.append(
      "dob",
      formData.dob ? new Date(formData.dob).toISOString().split("T")[0] : "",
    );
    formDataToSend.append("genderId", formData.genderId.toString());
    formDataToSend.append("address1", formData.address1);
    formDataToSend.append("countryId", formData.countryId.toString());
    formDataToSend.append("stateId", formData.stateId.toString());
    formDataToSend.append("districtId", formData.districtId.toString());
    formDataToSend.append("city", formData.city || "");
    formDataToSend.append("pincode", formData.pincode);
    formDataToSend.append("mobileNo", formData.mobileNo);
    formDataToSend.append("registrationNo", formData.registrationNo);
    formDataToSend.append(
      "registrationNumber",
      formData.registrationNumber || "",
    );
    formDataToSend.append(
      "identificationType",
      formData.identificationType.toString(),
    );
    formDataToSend.append("employeeTypeId", formData.employeeTypeId.toString());
    formDataToSend.append(
      "employmentTypeId",
      formData.employmentTypeId.toString(),
    );
    formDataToSend.append("roleId", formData.roleId.toString());
    if (formData.fromDate) {
      formDataToSend.append(
        "fromDate",
        new Date(formData.fromDate).toISOString(),
      );
    } else {
      formDataToSend.append("fromDate", "");
    }
    formDataToSend.append(
      "profileDescription",
      formData.profileDescription || "",
    );

    // Convert to number
    const yearExp = formData.totalExperience
      ? parseInt(formData.totalExperience, 10)
      : 0;
    formDataToSend.append("yearOfExperience", yearExp.toString());
    formDataToSend.append("qualifications", formData.qualifications || "");
    formDataToSend.append(
      "medicalRegistrationNo",
      formData.medicalRegistrationNo || "",
    );

    formDataToSend.append(
      "masDesignationId",
      formData.designationId.toString(),
    );

    if (formData.profilePicName && formData.profilePicName instanceof File) {
      formDataToSend.append("profilePicName", formData.profilePicName);
    }

    if (formData.idDocumentName && formData.idDocumentName instanceof File) {
      formDataToSend.append("idDocumentName", formData.idDocumentName);
    }

    // 3. Qualification Array - FIXED
    formData.qualification.forEach((qual, index) => {
      formDataToSend.append(
        `qualification[${index}].employeeQualificationId`,
        (qual.employeeQualificationId || index + 1).toString(),
      );

      formDataToSend.append(
        `qualification[${index}].institutionName`,
        qual.institutionName || "",
      );

      // FIX: Send number or 0, not empty string
      const year = qual.completionYear ? parseInt(qual.completionYear, 10) : 0;
      formDataToSend.append(
        `qualification[${index}].completionYear`,
        year.toString(),
      );

      formDataToSend.append(
        `qualification[${index}].qualificationName`,
        qual.qualificationName || "",
      );

      // Only send file if it exists
      if (qual.filePath && qual.filePath instanceof File) {
        formDataToSend.append(
          `qualification[${index}].filePath`,
          qual.filePath,
        );
      }
      // Don't send empty filePath
    });

    formData.languages.forEach((language, index) => {
      if (language.languageIdValue) {
        formDataToSend.append(
          `languages[${index}].languageId`,
          language.languageIdValue.toString(),
        );
      }

      formDataToSend.append(
        `languages[${index}].languageName`,
        language.languageName || "",
      );
    });

    // 4. Document Array - Add ID field
    formData.document.forEach((doc, index) => {
      formDataToSend.append(
        `document[${index}].employeeDocumentId`,
        (doc.employeeDocumentId || index + 1).toString(),
      );
      formDataToSend.append(
        `document[${index}].documentName`,
        doc.documentName || "",
      );
      if (doc.filePath && doc.filePath instanceof File) {
        formDataToSend.append(`document[${index}].filePath`, doc.filePath);
      }
    });

    // 5. Specialty Center Array - Add ID field
    formData.specialtyCenter.forEach((center, index) => {
      formDataToSend.append(
        `specialtyCenter[${index}].specialtyCenterName`,
        center.specialtyCenterName || "",
      );
      formDataToSend.append(
        `specialtyCenter[${index}].centerId`,
        center.centerId || "",
      );
      formDataToSend.append(
        `specialtyCenter[${index}].isPrimary`,
        (index === 0).toString(),
      );
    });

    // 6. Work Experience - Add ID field
    formData.workExperiences.forEach((exp, index) => {
      formDataToSend.append(
        `workExperiences[${index}].experienceSummary`,
        exp.organizationName || "",
      );
    });

    // 7. Memberships - Add ID field
    formData.memberships.forEach((level, index) => {
      formDataToSend.append(
        `employeeMemberships[${index}].membershipSummary`,
        level.levelName || "",
      );
    });

    // 8. Specialty Interest - Add ID field
    formData.specialtyInterest.forEach((interest, index) => {
      formDataToSend.append(
        `employeeSpecialtyInterests[${index}].interestSummary`,
        interest.specialtyInterestName || "",
      );
    });

    // 9. Awards & Distinctions - Add ID field
    formData.awardsDistinction.forEach((award, index) => {
      formDataToSend.append(
        `employeeAwards[${index}].awardSummary`,
        award.awardName || "",
      );
    });

    // Debug: FormData content print करें
    console.log("=== Sending FormData ===");
    for (let pair of formDataToSend.entries()) {
      if (pair[1] instanceof File) {
        console.log(
          pair[0],
          "[File]",
          pair[1].name,
          pair[1].type,
          pair[1].size + " bytes",
        );
      } else {
        console.log(pair[0], pair[1]);
      }
    }

    return formDataToSend;
  };

  const handleReset = () => {
    setFormData({
      ...initialFormData,
      languages: [{ languageId: 1, languageName: "", languageIdValue: "" }],
      registrationNumber: "",
      fromDate: "",
      dob: "",
      qualification: [
        {
          employeeQualificationId: 1,
          institutionName: "",
          completionYear: "",
          qualificationName: "",
          filePath: null,
        },
      ],
      document: [{ employeeDocumentId: 1, documentName: "", filePath: null }],
      specialtyCenter: [
        { specialtyCenterId: 1, specialtyCenterName: "", centerId: "" },
      ],
      workExperiences: [{ experienceId: 1, organizationName: "" }],
      memberships: [{ membershipsId: 1, levelName: "" }],
      specialtyInterest: [{ interestId: 1, specialtyInterestName: "" }],
      awardsDistinction: [{ awardId: 1, awardName: "" }],
      profilePicPreview: null,
      profilePicType: null,
      idDocumentPreview: null,
      idDocumentType: null,
    });

    setErrors({});

    if (profileEditorRef.current) {
      profileEditorRef.current.setData("");
    }

    const fileInputs = [
      "profilePicName",
      "idDocumentName",
      ...formData.qualification.map((_, index) => `qualification_${index}`),
      ...formData.document.map((_, index) => `document_${index}`),
    ];

    fileInputs.forEach((id) => {
      const input = document.getElementById(id);
      if (input) input.value = "";
    });

    setPreviewModal({
      show: false,
      type: "",
      url: "",
      fileName: "",
      section: "",
    });

    setSpecialtySearch(null);
    setSelectedDesignationId("");
    setDesignationData([]);
  };

  const handleCreate = async () => {
    if (!validateForm()) {
      return;
    }

    if (!validateAllFilesBeforeSubmit()) {
      return;
    }

    const formDataToSend = prepareFormData();
    if (!formDataToSend) return;

    setLoading(true);
    try {
      const response = await postRequestWithFormData(
        CREATE_EMPLOYEE,
        formDataToSend,
      );

      console.log("Success Response:", response);

      if (response && (response.status === 200 || response.status === 201)) {
        showPopup("Employee created successfully", "success");
        handleReset();
      } else {
        const errorMessage = response?.message || "Unknown error occurred";
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Error creating employee:", error);

      if (
        error.message?.includes("Mobile number already registered") ||
        error.message?.includes("409") ||
        error.response?.status === 409
      ) {
        showPopup(error.message || "Mobile number already registered", "error");
        setErrors((prev) => ({
          ...prev,
          mobileNo: error.message || "This mobile number is already registered",
        }));
        setTimeout(() => {
          const mobileField = document.getElementById("mobileNo");
          if (mobileField) {
            mobileField.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
            mobileField.focus();
          }
        }, 100);
        return;
      }

      showPopup(
        error.message || "Error submitting form. Please try again.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWithApprove = async () => {
    const formDataToSend = prepareFormData();
    if (!formDataToSend) return;

    setLoading(true);
    try {
      const response = await postRequestWithFormData(
        CREATE_APPROVE_EMPLOYEE,
        formDataToSend,
      );

      console.log("Success Response:", response);

      if (response && (response.status === 200 || response.status === 201)) {
        showPopup("Employee created and approved successfully", "success");
        handleReset();
      } else {
        const errorMessage = response?.message || "Unknown error occurred";
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Error creating and approving employee:", error);

      if (
        error.message?.includes("Mobile number already registered") ||
        error.message?.includes("409") ||
        error.response?.status === 409
      ) {
        showPopup(error.message || "Mobile number already registered", "error");
        setErrors((prev) => ({
          ...prev,
          mobileNo: error.message || "This mobile number is already registered",
        }));
        setTimeout(() => {
          const mobileField = document.getElementById("mobileNo");
          if (mobileField) {
            mobileField.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
            mobileField.focus();
          }
        }, 100);
        return;
      }

      showPopup(
        error.message || "Error creating and approving employee",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <LoadingScreen />}
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
                <div className="card-header   border-bottom-1 py-3">
                  <h6 className="fw-bold mb-0">Employee Registration</h6>
                </div>
                <div className="card-body">
                  <form>
                    <div className="g-3 row">
                      <div className="col-md-9">
                        <div className="g-3 row">
                          <div className="col-md-4">
                            <label className="form-label">
                              First Name <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              className={`form-control ${errors.firstName ? "is-invalid" : ""}`}
                              id="firstName"
                              placeholder="First Name"
                              onChange={handleInputChange}
                              value={formData.firstName}
                              maxLength={mlenght}
                            />
                            {errors.firstName && (
                              <div className="invalid-feedback">
                                {errors.firstName}
                              </div>
                            )}
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
                            <label className="form-label">
                              Last Name <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              className={`form-control ${errors.lastName ? "is-invalid" : ""}`}
                              id="lastName"
                              placeholder="Last Name"
                              onChange={handleInputChange}
                              value={formData.lastName}
                              maxLength={mlenght}
                            />
                            {errors.lastName && (
                              <div className="invalid-feedback">
                                {errors.lastName}
                              </div>
                            )}
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">
                              Date of Birth{" "}
                              <span className="text-danger">*</span>
                            </label>
                            <input
                              type="date"
                              required
                              id="dob"
                              value={formData.dob}
                              className={`form-control ${errors.dob ? "is-invalid" : ""}`}
                              max={new Date().toISOString().split("T")[0]}
                              onChange={handleInputChange}
                            />
                            {errors.dob && (
                              <div className="invalid-feedback">
                                {errors.dob}
                              </div>
                            )}
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">
                              Gender <span className="text-danger">*</span>
                            </label>
                            <select
                              className={`form-select ${errors.genderId ? "is-invalid" : ""}`}
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
                            {errors.genderId && (
                              <div className="invalid-feedback">
                                {errors.genderId}
                              </div>
                            )}
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">
                              Address <span className="text-danger">*</span>
                            </label>
                            <textarea
                              required
                              id="address1"
                              value={formData.address1}
                              className={`form-control ${errors.address1 ? "is-invalid" : ""}`}
                              onChange={handleInputChange}
                              placeholder="Address"
                            />
                            {errors.address1 && (
                              <div className="invalid-feedback">
                                {errors.address1}
                              </div>
                            )}
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">
                              Country <span className="text-danger">*</span>
                            </label>
                            <select
                              className={`form-select ${errors.countryId ? "is-invalid" : ""}`}
                              value={formData.countryId}
                              onChange={(e) => {
                                const selectedCountry = countryData.find(
                                  (country) =>
                                    country.id.toString() === e.target.value,
                                );
                                handleCountryChange(
                                  selectedCountry.countryCode,
                                  selectedCountry.id,
                                );
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
                            {errors.countryId && (
                              <div className="invalid-feedback">
                                {errors.countryId}
                              </div>
                            )}
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">
                              State <span className="text-danger">*</span>
                            </label>
                            <select
                              className={`form-select ${errors.stateId ? "is-invalid" : ""}`}
                              value={formData.stateId}
                              onChange={(e) => {
                                const selectedState = stateData.find(
                                  (state) =>
                                    state.id.toString() === e.target.value,
                                );
                                handleStateChange(
                                  selectedState.stateCode,
                                  selectedState.id,
                                );
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
                            {errors.stateId && (
                              <div className="invalid-feedback">
                                {errors.stateId}
                              </div>
                            )}
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">
                              District <span className="text-danger">*</span>
                            </label>
                            <select
                              className={`form-select ${errors.districtId ? "is-invalid" : ""}`}
                              value={formData.districtId}
                              onChange={(e) =>
                                handleDistrictChange(e.target.value)
                              }
                              disabled={loading || !formData.stateId}
                            >
                              <option value="">Select District</option>
                              {districtData.map((dist) => (
                                <option key={dist.id} value={dist.id}>
                                  {dist.districtName}
                                </option>
                              ))}
                            </select>
                            {errors.districtId && (
                              <div className="invalid-feedback">
                                {errors.districtId}
                              </div>
                            )}
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">
                              City <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              className={`form-control ${errors.city ? "is-invalid" : ""}`}
                              id="city"
                              placeholder="City"
                              onChange={handleInputChange}
                              value={formData.city}
                              maxLength={mlenght}
                            />
                            {errors.city && (
                              <div className="invalid-feedback">
                                {errors.city}
                              </div>
                            )}
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">
                              Pincode <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              className={`form-control ${errors.pincode ? "is-invalid" : ""}`}
                              id="pincode"
                              placeholder="Pincode"
                              onChange={handleInputMobileChange}
                              value={formData.pincode}
                              maxLength={6}
                              minLength={6}
                              inputMode="numeric"
                              pattern="\d*"
                            />
                            {errors.pincode && (
                              <div className="invalid-feedback">
                                {errors.pincode}
                              </div>
                            )}
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">
                              Mobile No. <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              className={`form-control ${errors.mobileNo ? "is-invalid" : ""}`}
                              id="mobileNo"
                              placeholder="Mobile No."
                              onChange={handleInputMobileChange}
                              value={formData.mobileNo}
                              maxLength={10}
                              minLength={10}
                              inputMode="numeric"
                              pattern="\d*"
                            />
                            {errors.mobileNo && (
                              <div className="invalid-feedback">
                                {errors.mobileNo}
                              </div>
                            )}
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">
                              ID Type <span className="text-danger">*</span>
                            </label>
                            <select
                              className={`form-select ${errors.identificationType ? "is-invalid" : ""}`}
                              style={{ paddingRight: "40px" }}
                              value={formData.identificationType}
                              onChange={(e) =>
                                handleIdTypeChange(parseInt(e.target.value, 10))
                              }
                              disabled={loading}
                            >
                              <option value="">Select ID Type</option>
                              {idTypeData.map((idType) => (
                                <option
                                  key={idType.identificationTypeId}
                                  value={idType.identificationTypeId}
                                >
                                  {idType.identificationName}
                                </option>
                              ))}
                            </select>
                            {errors.identificationType && (
                              <div className="invalid-feedback">
                                {errors.identificationType}
                              </div>
                            )}
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">
                              ID Number <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              className={`form-control ${errors.registrationNo ? "is-invalid" : ""}`}
                              id="registrationNo"
                              placeholder="ID Number"
                              onChange={handleInputChange}
                              value={formData.registrationNo}
                              maxLength={mlenght}
                            />
                            {errors.registrationNo && (
                              <div className="invalid-feedback">
                                {errors.registrationNo}
                              </div>
                            )}
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">
                              ID Upload (JPEG/PDF){" "}
                              <span className="text-danger">*</span>
                              <small className="text-muted ms-2">
                                (Max 1MB)
                              </small>
                            </label>
                            <input
                              type="file"
                              id="idDocumentName"
                              className={`form-control ${errors.idDocumentName ? "is-invalid" : ""}`}
                              accept=".jpg,.jpeg,.png,.pdf"
                              onChange={(e) =>
                                handleFileWithPreview(e, "idDocument")
                              }
                              style={{ fontSize: "12px", padding: "4px 8px" }}
                            />
                            {errors.idDocumentName && (
                              <div className="invalid-feedback">
                                {errors.idDocumentName}
                              </div>
                            )}
                            {formData.idDocumentPreview && (
                              <div className="mt-1 d-flex align-items-center gap-1">
                                <small
                                  className="text-success"
                                  style={{ fontSize: "11px" }}
                                >
                                  <i className="icofont-check-circled me-1"></i>
                                  {(
                                    formData.idDocumentName?.name ||
                                    "ID Document"
                                  ).substring(0, 10)}
                                  {(
                                    formData.idDocumentName?.name ||
                                    "ID Document"
                                  ).length > 10
                                    ? "..."
                                    : ""}
                                </small>
                                <div className="d-flex gap-1 ms-auto">
                                  <button
                                    type="button"
                                    className="btn btn-link p-0"
                                    onClick={() => {
                                      openPreview(
                                        formData.idDocumentPreview,
                                        formData.idDocumentType ===
                                          "application/pdf"
                                          ? "pdf"
                                          : "image",
                                        formData.idDocumentName?.name ||
                                          "ID Document",
                                        "idDocument",
                                      );
                                    }}
                                    title="Preview"
                                    style={{
                                      fontSize: "12px",
                                      color: "#0d6efd",
                                      width: "20px",
                                      height: "20px",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    <i className="icofont-eye"></i>
                                  </button>
                                  <a
                                    href={formData.idDocumentPreview}
                                    download={formData.idDocumentName?.name}
                                    className="btn btn-link p-0"
                                    title="Download"
                                    style={{
                                      fontSize: "12px",
                                      color: "#198754",
                                      width: "20px",
                                      height: "20px",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    <i className="icofont-download"></i>
                                  </a>
                                  <button
                                    type="button"
                                    className="btn btn-link p-0"
                                    onClick={() => {
                                      setFormData((prev) => ({
                                        ...prev,
                                        idDocumentName: null,
                                        idDocumentPreview: null,
                                        idDocumentType: null,
                                      }));
                                      document.getElementById(
                                        "idDocumentName",
                                      ).value = "";
                                    }}
                                    title="Remove"
                                    style={{
                                      fontSize: "12px",
                                      color: "#dc3545",
                                      width: "20px",
                                      height: "20px",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    <i className="icofont-close"></i>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="col-md-4">
                            <label className="form-label">
                              Total Experience (Years){" "}
                              <span className="text-danger">*</span>
                            </label>
                            <input
                              type="number"
                              className={`form-control ${errors.totalExperience ? "is-invalid" : ""}`}
                              id="totalExperience"
                              value={formData.totalExperience}
                              placeholder="Enter total experience in years"
                              min="0"
                              max="60"
                              onChange={handleInputChange}
                              onKeyDown={(e) => {
                                if (
                                  e.key === "e" ||
                                  e.key === "-" ||
                                  e.key === "+"
                                ) {
                                  e.preventDefault();
                                }
                              }}
                            />
                            {errors.totalExperience && (
                              <div className="invalid-feedback">
                                {errors.totalExperience}
                              </div>
                            )}
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">
                              Registration Number{" "}
                              <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className={`form-control ${errors.registrationNumber ? "is-invalid" : ""}`}
                              id="registrationNumber"
                              placeholder="Registration Number"
                              onChange={handleInputChange}
                              value={formData.registrationNumber || ""}
                              maxLength={mlenght}
                            />
                            {errors.registrationNumber && (
                              <div className="invalid-feedback">
                                {errors.registrationNumber}
                              </div>
                            )}
                          </div>
                          {viewDept && (
                            <div className="col-md-4">
                              <label className="form-label">
                                Department Name{" "}
                                <span className="text-danger">*</span>
                              </label>
                              <select
                                className="form-select"
                                style={{ paddingRight: "40px" }}
                                value={formData.departmentId}
                                onChange={(e) =>
                                  handleDepartmentChange(
                                    parseInt(e.target.value, 10),
                                  )
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
                            <label className="form-label">
                              Employee Type{" "}
                              <span className="text-danger">*</span>
                            </label>
                            <select
                              className={`form-select ${errors.employeeTypeId ? "is-invalid" : ""}`}
                              style={{ paddingRight: "40px" }}
                              value={formData.employeeTypeId}
                              onChange={(e) =>
                                handleEmployeeTypeChange(
                                  parseInt(e.target.value, 10),
                                )
                              }
                              disabled={loading}
                            >
                              <option value="">Select Employee Type</option>
                              {employeeTypeData.map((empType) => (
                                <option
                                  key={empType.userTypeId}
                                  value={empType.userTypeId}
                                >
                                  {empType.userTypeName}
                                </option>
                              ))}
                            </select>
                            {errors.employeeTypeId && (
                              <div className="invalid-feedback">
                                {errors.employeeTypeId}
                              </div>
                            )}
                          </div>

                          <div className="col-md-4">
                            <label className="form-label">
                              Designation <span className="text-danger">*</span>
                            </label>
                            <select
                              className={`form-select ${errors.designationId ? "is-invalid" : ""}`}
                              style={{ paddingRight: "40px" }}
                              value={formData.designationId}
                              onChange={(e) =>
                                handleDesignationChange(
                                  parseInt(e.target.value, 10),
                                )
                              }
                              disabled={loading}
                            >
                              <option value="">Select Designation</option>
                              {designationData.map((designation) => (
                                <option
                                  key={designation.designationId}
                                  value={designation.designationId}
                                >
                                  {designation.designationName}
                                </option>
                              ))}
                            </select>
                            {errors.designationId && (
                              <div className="invalid-feedback">
                                {errors.designationId}
                              </div>
                            )}
                          </div>

                          <div className="col-md-4">
                            <label className="form-label">
                              Employment Type{" "}
                              <span className="text-danger">*</span>
                            </label>
                            <select
                              className={`form-select ${errors.employmentTypeId ? "is-invalid" : ""}`}
                              style={{ paddingRight: "40px" }}
                              value={formData.employmentTypeId}
                              onChange={(e) =>
                                handleEmploymentTypeChange(
                                  parseInt(e.target.value, 10),
                                )
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
                            {errors.employmentTypeId && (
                              <div className="invalid-feedback">
                                {errors.employmentTypeId}
                              </div>
                            )}
                          </div>

                          <div className="col-md-4">
                            <label className="form-label">
                              Role <span className="text-danger">*</span>
                            </label>
                            <select
                              className={`form-select ${errors.roleId ? "is-invalid" : ""}`}
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
                            {errors.roleId && (
                              <div className="invalid-feedback">
                                {errors.roleId}
                              </div>
                            )}
                          </div>

                          <div className="col-md-4">
                            <label className="form-label">
                              Period of Employment From Date
                            </label>
                            <input
                              type="date"
                              id="fromDate"
                              value={formData.fromDate}
                              className="form-control"
                              onChange={handleInputChange}
                              min={new Date().toISOString().split("T")[0]}
                              max={maxDateStr}
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">
                              Medical Registration Number{" "}
                              <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              className={`form-control ${errors.medicalRegistrationNo ? "is-invalid" : ""}`}
                              id="medicalRegistrationNo"
                              placeholder="Medical Registration Number"
                              onChange={handleInputChange}
                              value={formData.medicalRegistrationNo}
                              maxLength={mlenght}
                            />
                            {errors.medicalRegistrationNo && (
                              <div className="invalid-feedback">
                                {errors.medicalRegistrationNo}
                              </div>
                            )}
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">
                              Qualifications{" "}
                              <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              className={`form-control ${errors.qualifications ? "is-invalid" : ""}`}
                              id="qualifications"
                              placeholder="Enter qualifications"
                              onChange={handleInputChange}
                              value={formData.qualifications}
                              maxLength={mlenght}
                            />
                            {errors.qualifications && (
                              <div className="invalid-feedback">
                                {errors.qualifications}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3 d-flex flex-column">
                        <label className="form-label">
                          Profile Image <span className="text-danger">*</span>
                          <small className="text-muted ms-2">
                            (Max 1MB, JPG/PNG)
                          </small>
                        </label>
                        <div
                          className={`d-flex flex-column align-items-center border p-2 ${errors.profilePicName ? "border-danger" : ""}`}
                        >
                          {/* ❌ MISSING: Image preview div */}
                          <div
                            style={{
                              width: "100%",
                              height: "150px",
                              overflow: "hidden",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              backgroundColor: "#f8f9fa",
                              cursor: formData.profilePicPreview
                                ? "pointer"
                                : "default",
                            }}
                            onClick={() => {
                              if (formData.profilePicPreview) {
                                openPreview(
                                  formData.profilePicPreview,
                                  formData.profilePicType?.startsWith("image/")
                                    ? "image"
                                    : "pdf",
                                  formData.profilePicName?.name ||
                                    "Profile Image",
                                  "profile",
                                );
                              }
                            }}
                          >
                            <img
                              src={
                                formData.profilePicPreview || placeholderImage
                              }
                              alt="Profile"
                              style={{
                                objectFit: "cover",
                                maxWidth: "100%",
                                maxHeight: "100%",
                                borderRadius: "4px",
                              }}
                            />
                          </div>
                          <input
                            type="file"
                            id="profilePicName"
                            className={`form-control mt-2 ${errors.profilePicName ? "is-invalid" : ""}`}
                            accept="image/*"
                            onChange={(e) =>
                              handleFileWithPreview(e, "profile")
                            }
                            style={{ fontSize: "12px", padding: "4px 8px" }}
                          />
                          {errors.profilePicName && (
                            <div className="invalid-feedback d-block">
                              {errors.profilePicName}
                            </div>
                          )}
                          {formData.profilePicPreview && (
                            <div
                              className="d-flex gap-1 mt-1"
                              style={{ width: "100%" }}
                            >
                              <button
                                type="button"
                                className="btn btn-sm btn-info"
                                onClick={() => {
                                  openPreview(
                                    formData.profilePicPreview,
                                    "image",
                                    formData.profilePicName?.name ||
                                      "Profile Image",
                                    "profile",
                                  );
                                }}
                                style={{
                                  fontSize: "11px",
                                  padding: "2px 6px",
                                  flex: 1,
                                }}
                              >
                                <i className="icofont-eye me-1"></i> Preview
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    profilePicName: null,
                                    profilePicPreview: null,
                                    profilePicType: null,
                                  }));
                                  document.getElementById(
                                    "profilePicName",
                                  ).value = "";
                                }}
                                style={{
                                  fontSize: "11px",
                                  padding: "2px 6px",
                                  flex: 1,
                                }}
                              >
                                <i className="icofont-close me-1"></i> Remove
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="col-md-12">
                        <label className="form-label">
                          Profile Description{" "}
                          <span className="text-danger">*</span>
                        </label>
                        <div className="form-group col-md-10">
                          <div
                            className={`form-label ${errors.profileDescription ? "border-danger" : ""}`}
                            style={{
                              border: "1px solid #ced4da",
                              borderRadius: "6px",
                              padding: "8px",
                            }}
                          >
                            <div ref={profileInclusionRef}></div>
                            <CKEditor
                              editor={DecoupledEditor}
                              data={formData.profileDescription}
                              config={{
                                toolbar: { shouldNotGroupWhenFull: true },
                                alignment: {
                                  options: [
                                    "left",
                                    "center",
                                    "right",
                                    "justify",
                                  ],
                                },
                              }}
                              onReady={(editor) => {
                                profileEditorRef.current = editor;
                                if (profileInclusionRef.current) {
                                  profileInclusionRef.current.innerHTML = "";
                                  profileInclusionRef.current.appendChild(
                                    editor.ui.view.toolbar.element,
                                  );
                                }
                              }}
                              onChange={handleProfileEditorChange}
                            />
                          </div>
                          {errors.profileDescription && (
                            <div className="invalid-feedback d-block">
                              {errors.profileDescription}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* Educational Qualification Section with Error Handling */}
          <div className="row mb-3">
            <div className="col-sm-12">
              <div className="card shadow mb-3">
                <div className="card-header border-bottom-1 py-3">
                  <h6 className="fw-bold mb-0">
                    Educational Qualification{" "}
                    <span className="text-danger">*</span>
                  </h6>
                  {errors.qualification && (
                    <small className="text-danger">
                      Please fill all qualification fields
                    </small>
                  )}
                </div>
                <div className="card-body">
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>S.No</th>
                        <th>
                          Degree <span className="text-danger">*</span>
                        </th>
                        <th>
                          Name of Institution{" "}
                          <span className="text-danger">*</span>
                        </th>
                        <th>
                          Year of Completion{" "}
                          <span className="text-danger">*</span>
                        </th>
                        <th>
                          File Upload <span className="text-danger">*</span>
                          <small
                            className="text-muted d-block"
                            style={{ fontSize: "10px" }}
                          >
                            Max 1MB
                          </small>
                        </th>
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
                              className={`form-control ${hasError("qualification", index, "qualificationName") ? "is-invalid" : ""}`}
                              value={row.qualificationName}
                              placeholder="Degree"
                              onChange={(e) =>
                                handleQualificationChange(
                                  index,
                                  "qualificationName",
                                  e.target.value,
                                )
                              }
                              maxLength={plength}
                            />
                            {hasError(
                              "qualification",
                              index,
                              "qualificationName",
                            ) && (
                              <div className="invalid-feedback">
                                {getErrorMessage(
                                  "qualification",
                                  index,
                                  "qualificationName",
                                )}
                              </div>
                            )}
                          </td>
                          <td>
                            <input
                              type="text"
                              className={`form-control ${hasError("qualification", index, "institutionName") ? "is-invalid" : ""}`}
                              value={row.institutionName}
                              placeholder="Institution Name"
                              onChange={(e) =>
                                handleQualificationChange(
                                  index,
                                  "institutionName",
                                  e.target.value,
                                )
                              }
                              maxLength={plength}
                            />
                            {hasError(
                              "qualification",
                              index,
                              "institutionName",
                            ) && (
                              <div className="invalid-feedback">
                                {getErrorMessage(
                                  "qualification",
                                  index,
                                  "institutionName",
                                )}
                              </div>
                            )}
                          </td>
                          <td>
                            <input
                              type="text"
                              className={`form-control ${hasError("qualification", index, "completionYear") ? "is-invalid" : ""}`}
                              placeholder="YYYY"
                              value={row.completionYear}
                              onChange={(e) =>
                                handleQualificationYearChange(
                                  index,
                                  "completionYear",
                                  e.target.value,
                                )
                              }
                              maxLength={4}
                              minLength={4}
                              inputMode="numeric"
                              pattern="\d{4}"
                            />
                            {hasError(
                              "qualification",
                              index,
                              "completionYear",
                            ) && (
                              <div className="invalid-feedback">
                                {getErrorMessage(
                                  "qualification",
                                  index,
                                  "completionYear",
                                )}
                              </div>
                            )}
                          </td>
                          <td>
                            <div>
                              <input
                                type="file"
                                className={`form-control ${hasError("qualification", index, "filePath") ? "is-invalid" : ""}`}
                                onChange={(e) =>
                                  handleFileWithPreview(
                                    e,
                                    "qualification",
                                    index,
                                  )
                                }
                                accept=".pdf,.jpg,.jpeg,.png"
                                style={{ fontSize: "12px", padding: "4px 8px" }}
                              />
                              {hasError("qualification", index, "filePath") && (
                                <div
                                  className="invalid-feedback"
                                  style={{ fontSize: "11px" }}
                                >
                                  {getErrorMessage(
                                    "qualification",
                                    index,
                                    "filePath",
                                  )}
                                </div>
                              )}
                              {row.filePath && (
                                <div className="mt-1">
                                  <div className="d-flex align-items-center">
                                    <small
                                      className="text-success"
                                      style={{ fontSize: "10px" }}
                                    >
                                      <i className="icofont-check-circled me-1"></i>
                                      {(
                                        row.fileName || row.filePath.name
                                      ).substring(0, 10)}
                                      {(row.fileName || row.filePath.name)
                                        .length > 10
                                        ? "..."
                                        : ""}
                                    </small>
                                    <div className="d-flex gap-1 ms-auto">
                                      <button
                                        type="button"
                                        className="btn btn-link p-0"
                                        onClick={() => {
                                          openPreview(
                                            row.filePreview,
                                            row.fileType === "application/pdf"
                                              ? "pdf"
                                              : "image",
                                            row.fileName || row.filePath.name,
                                            "qualification",
                                          );
                                        }}
                                        title="Preview file"
                                        style={{
                                          fontSize: "11px",
                                          color: "#0d6efd",
                                          width: "18px",
                                          height: "18px",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                        }}
                                      >
                                        <i className="icofont-eye"></i>
                                      </button>
                                      <a
                                        href={row.filePreview}
                                        download={
                                          row.fileName || row.filePath.name
                                        }
                                        className="btn btn-link p-0"
                                        title="Download file"
                                        style={{
                                          fontSize: "11px",
                                          color: "#198754",
                                          width: "18px",
                                          height: "18px",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                        }}
                                      >
                                        <i className="icofont-download"></i>
                                      </a>
                                      <button
                                        type="button"
                                        className="btn btn-link p-0"
                                        onClick={() => {
                                          setFormData((prev) => ({
                                            ...prev,
                                            qualification:
                                              prev.qualification.map(
                                                (item, i) =>
                                                  i === index
                                                    ? {
                                                        ...item,
                                                        filePath: null,
                                                        filePreview: null,
                                                        fileName: "",
                                                        fileType: "",
                                                      }
                                                    : item,
                                              ),
                                          }));
                                        }}
                                        title="Remove file"
                                        style={{
                                          fontSize: "11px",
                                          color: "#dc3545",
                                          width: "18px",
                                          height: "18px",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                        }}
                                      >
                                        <i className="icofont-close"></i>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            {formData.qualification.length > 1 && (
                              <button
                                type="button"
                                className="btn btn-danger"
                                onClick={() => removeEducationRow(index)}
                              >
                                <i className="icofont-close"></i>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={addEducationRow}
                  >
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
                <div className="card-header border-bottom-1 py-3">
                  <h6 className="fw-bold mb-0">
                    Specialty Center Name <span className="text-danger">*</span>
                  </h6>
                  {errors.specialtyCenter && (
                    <small className="text-danger">
                      Please fill all specialty center fields
                    </small>
                  )}
                </div>
                <div className="card-body">
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>S.No</th>
                        <th>
                          Specialty Center Name{" "}
                          <span className="text-danger">*</span>
                        </th>
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
                                className={`form-control ${hasError("specialtyCenter", index, "specialtyCenterName") ? "is-invalid" : ""}`}
                                value={row.specialtyCenterName}
                                placeholder="Enter speciality details"
                                onChange={(e) => {
                                  handleSpecialtyCenterChange(
                                    index,
                                    "specialtyCenterName",
                                    e.target.value,
                                  );
                                  // Use row-specific search state
                                  const searchValue = e.target.value;
                                  if (searchValue.length >= 1) {
                                    setSpecialtySearch({
                                      index,
                                      value: searchValue,
                                    });
                                  } else {
                                    setSpecialtySearch(null);
                                  }
                                }}
                                onBlur={() => {
                                  // Clear search after a delay when input loses focus
                                  setTimeout(
                                    () => setSpecialtySearch(null),
                                    200,
                                  );
                                }}
                                maxLength={mlenght}
                              />
                              {hasError(
                                "specialtyCenter",
                                index,
                                "specialtyCenterName",
                              ) && (
                                <div className="invalid-feedback">
                                  {getErrorMessage(
                                    "specialtyCenter",
                                    index,
                                    "specialtyCenterName",
                                  )}
                                </div>
                              )}

                              {/* Dropdown only shows for the current row being edited */}
                              {specialtySearch &&
                                specialtySearch.index === index &&
                                filteredSpecialtyCenters.length > 0 && (
                                  <div
                                    className="dropdown-menu show w-100"
                                    style={{
                                      position: "absolute",
                                      top: "100%",
                                      left: 0,
                                      zIndex: 1050,
                                      maxHeight: "200px",
                                      overflowY: "auto",
                                      display: "block",
                                    }}
                                  >
                                    {filteredSpecialtyCenters.map((center) => (
                                      <button
                                        key={center.centerId}
                                        type="button"
                                        className="dropdown-item"
                                        onClick={() => {
                                          handleSpecialtyCenterChange(
                                            index,
                                            "specialtyCenterName",
                                            center.centerName ||
                                              center.specialtyCenterName ||
                                              "",
                                          );
                                          handleSpecialtyCenterChange(
                                            index,
                                            "centerId",
                                            center.centerId || "",
                                          );
                                          setSpecialtySearch(null);
                                        }}
                                        style={{ cursor: "pointer" }}
                                      >
                                        {center.centerName ||
                                          center.specialtyCenterName ||
                                          ""}
                                        {center.centerCode &&
                                          ` (${center.centerCode})`}
                                      </button>
                                    ))}
                                  </div>
                                )}
                            </div>
                            {/* Hidden input for centerId */}
                            <input
                              type="hidden"
                              value={row.centerId || ""}
                              onChange={(e) =>
                                handleSpecialtyCenterChange(
                                  index,
                                  "centerId",
                                  e.target.value,
                                )
                              }
                            />
                            {hasError("specialtyCenter", index, "centerId") && (
                              <div className="invalid-feedback d-block">
                                {getErrorMessage(
                                  "specialtyCenter",
                                  index,
                                  "centerId",
                                )}
                              </div>
                            )}
                          </td>
                          <td>
                            {formData.specialtyCenter.length > 1 ? (
                              <button
                                type="button"
                                className="btn btn-danger"
                                onClick={() => removeSpecialtyCenterRow(index)}
                                title="Remove row"
                              >
                                <i className="icofont-close"></i>
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-secondary"
                                disabled
                                title="At least one specialty center is required"
                              >
                                <i className="icofont-close"></i>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={addSpecialtyCenterRow}
                  >
                    Add Row +
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* Language Known Section */}
          {/* Language Known Section */}
          {/* Language Known Section */}
          <div className="row mb-3">
            <div className="col-sm-12">
              <div className="card shadow mb-3">
                <div className="card-header border-bottom-1 py-3">
                  <h6 className="fw-bold mb-0">
                    Language Known <span className="text-danger">*</span>
                  </h6>
                  {errors.languages && (
                    <small className="text-danger">
                      Please select all languages
                    </small>
                  )}
                </div>
                <div className="card-body">
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>S.No</th>
                        <th>
                          Language <span className="text-danger">*</span>
                        </th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.languages.map((row, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>
                            <select
                              className={`form-select ${hasError("languages", index, "languageName") ? "is-invalid" : ""}`}
                              value={row.languageName}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value) {
                                  // Find the selected language from languageData
                                  const selectedLang = languageData.find(
                                    (lang) =>
                                      lang.language === value ||
                                      lang.languageName === value,
                                  );

                                  if (selectedLang) {
                                    // Update both languageName AND languageIdValue
                                    setFormData((prev) => ({
                                      ...prev,
                                      languages: prev.languages.map(
                                        (item, i) =>
                                          i === index
                                            ? {
                                                ...item,
                                                languageName: value,
                                                languageIdValue:
                                                  selectedLang.id.toString(),
                                              }
                                            : item,
                                      ),
                                    }));
                                  }
                                } else {
                                  // Clear both fields if empty selection
                                  setFormData((prev) => ({
                                    ...prev,
                                    languages: prev.languages.map((item, i) =>
                                      i === index
                                        ? {
                                            ...item,
                                            languageName: "",
                                            languageIdValue: "",
                                          }
                                        : item,
                                    ),
                                  }));
                                }
                              }}
                            >
                              <option value="">Select Language</option>
                              {languageData.map((lang) => (
                                <option
                                  key={lang.id}
                                  value={lang.language || lang.languageName}
                                >
                                  {lang.language || lang.languageName}
                                </option>
                              ))}
                            </select>
                            {hasError("languages", index, "languageName") && (
                              <div className="invalid-feedback">
                                {getErrorMessage(
                                  "languages",
                                  index,
                                  "languageName",
                                )}
                              </div>
                            )}
                          </td>
                          <td>
                            {formData.languages.length > 1 ? (
                              <button
                                type="button"
                                className="btn btn-danger"
                                onClick={() => removeLanguageRow(index)}
                                title="Remove language"
                              >
                                <i className="icofont-close"></i>
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-secondary"
                                disabled
                                title="At least one language is required"
                              >
                                <i className="icofont-close"></i>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={addLanguageRow}
                  >
                    <i className="icofont-plus me-1"></i> Add Language
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* Work Experience */}
          <div className="row mb-3">
            <div className="col-sm-12">
              <div className="card shadow mb-3">
                <div className="card-header border-bottom-1 py-3">
                  <h6 className="fw-bold mb-0">
                    Work Experience <span className="text-danger">*</span>
                  </h6>
                  {errors.workExperiences && (
                    <small className="text-danger">
                      Please fill all work experience fields
                    </small>
                  )}
                </div>
                <div className="card-body">
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>S.No</th>
                        <th>
                          Work Experience <span className="text-danger">*</span>
                        </th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.workExperiences.map((row, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>
                            <input
                              type="text"
                              className={`form-control ${hasError("workExperiences", index, "organizationName") ? "is-invalid" : ""}`}
                              value={row.organizationName}
                              placeholder="Enter organization details (e.g., Company Name, Position, Duration)"
                              onChange={(e) =>
                                handleWorkExperienceChange(
                                  index,
                                  "organizationName",
                                  e.target.value,
                                )
                              }
                              onBlur={(e) => {
                                // Update experienceSummary for backend
                                if (e.target.value.trim()) {
                                  handleWorkExperienceChange(
                                    index,
                                    "experienceSummary",
                                    e.target.value,
                                  );
                                }
                              }}
                              maxLength={plength}
                            />
                            {hasError(
                              "workExperiences",
                              index,
                              "organizationName",
                            ) && (
                              <div className="invalid-feedback">
                                {getErrorMessage(
                                  "workExperiences",
                                  index,
                                  "organizationName",
                                )}
                              </div>
                            )}
                          </td>
                          <td>
                            {formData.workExperiences.length > 1 ? (
                              <button
                                type="button"
                                className="btn btn-danger"
                                onClick={() => removeWorkExperienceRow(index)}
                                title="Remove work experience"
                              >
                                <i className="icofont-close"></i>
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-secondary"
                                disabled
                                title="At least one work experience is required"
                              >
                                <i className="icofont-close"></i>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="d-flex justify-content-between align-items-center">
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={addWorkExperienceRow}
                    >
                      <i className="icofont-plus me-1"></i> Add Work Experience
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Designation Levels */}
          <div className="row mb-3">
            <div className="col-sm-12">
              <div className="card shadow mb-3">
                <div className="card-header border-bottom-1 py-3">
                  <h6 className="fw-bold mb-0">
                    Memberships <span className="text-danger">*</span>
                  </h6>
                  {errors.memberships && (
                    <small className="text-danger">
                      Please fill all membership fields
                    </small>
                  )}
                </div>
                <div className="card-body">
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>S.No</th>
                        <th>
                          Membership Details{" "}
                          <span className="text-danger">*</span>
                        </th>
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
                              className={`form-control ${hasError("memberships", index, "levelName") ? "is-invalid" : ""}`}
                              value={row.levelName}
                              placeholder="Enter membership details (e.g., Professional Association, Member ID)"
                              onChange={(e) => {
                                handlemembershipsChange(
                                  index,
                                  "levelName",
                                  e.target.value,
                                );
                                if (e.target.value.trim()) {
                                  handlemembershipsChange(
                                    index,
                                    "membershipSummary",
                                    e.target.value,
                                  );
                                }
                              }}
                              onBlur={(e) => {
                                // Ensure membershipSummary is updated
                                if (
                                  e.target.value.trim() &&
                                  !row.membershipSummary
                                ) {
                                  handlemembershipsChange(
                                    index,
                                    "membershipSummary",
                                    e.target.value,
                                  );
                                }
                              }}
                              maxLength={plength}
                            />
                            {hasError("memberships", index, "levelName") && (
                              <div className="invalid-feedback">
                                {getErrorMessage(
                                  "memberships",
                                  index,
                                  "levelName",
                                )}
                              </div>
                            )}
                          </td>
                          <td>
                            {formData.memberships.length > 1 ? (
                              <button
                                type="button"
                                className="btn btn-danger"
                                onClick={() => removemembershipsRow(index)}
                                title="Remove membership"
                              >
                                <i className="icofont-close"></i>
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-secondary"
                                disabled
                                title="At least one membership is required"
                              >
                                <i className="icofont-close"></i>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="d-flex justify-content-between align-items-center">
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={addmembershipsRow}
                    >
                      <i className="icofont-plus me-1"></i> Add Membership
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Specialty Interest */}
          <div className="row mb-3">
            <div className="col-sm-12">
              <div className="card shadow mb-3">
                <div className="card-header border-bottom-1 py-3">
                  <h6 className="fw-bold mb-0">
                    Specialty Interest <span className="text-danger">*</span>
                  </h6>
                  {errors.specialtyInterest && (
                    <small className="text-danger">
                      Please fill all specialty interest fields
                    </small>
                  )}
                </div>
                <div className="card-body">
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>S.No</th>
                        <th>
                          Specialty Interest Name{" "}
                          <span className="text-danger">*</span>
                        </th>
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
                              className={`form-control ${hasError("specialtyInterest", index, "specialtyInterestName") ? "is-invalid" : ""}`}
                              value={row.specialtyInterestName}
                              placeholder="Enter specialty interest (e.g., Cardiology, Neurology, Pediatrics)"
                              onChange={(e) => {
                                handleSpecialtyInterestChange(
                                  index,
                                  "specialtyInterestName",
                                  e.target.value,
                                );
                                // Auto-update interestSummary for backend
                                if (e.target.value.trim()) {
                                  handleSpecialtyInterestChange(
                                    index,
                                    "interestSummary",
                                    e.target.value,
                                  );
                                }
                              }}
                              onBlur={(e) => {
                                // Ensure interestSummary is updated
                                if (
                                  e.target.value.trim() &&
                                  !row.interestSummary
                                ) {
                                  handleSpecialtyInterestChange(
                                    index,
                                    "interestSummary",
                                    e.target.value,
                                  );
                                }
                              }}
                              maxLength={plength}
                            />
                            {hasError(
                              "specialtyInterest",
                              index,
                              "specialtyInterestName",
                            ) && (
                              <div className="invalid-feedback">
                                {getErrorMessage(
                                  "specialtyInterest",
                                  index,
                                  "specialtyInterestName",
                                )}
                              </div>
                            )}
                          </td>
                          <td>
                            {formData.specialtyInterest.length > 1 ? (
                              <button
                                type="button"
                                className="btn btn-danger"
                                onClick={() =>
                                  removeSpecialtyInterestRow(index)
                                }
                                title="Remove specialty interest"
                              >
                                <i className="icofont-close"></i>
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-secondary"
                                disabled
                                title="At least one specialty interest is required"
                              >
                                <i className="icofont-close"></i>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="d-flex justify-content-between align-items-center">
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={addSpecialtyInterestRow}
                    >
                      <i className="icofont-plus me-1"></i> Add Specialty
                      Interest
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Awards & Distinctions */}
          <div className="row mb-3">
            <div className="col-sm-12">
              <div className="card shadow mb-3">
                <div className="card-header border-bottom-1 py-3">
                  <h6 className="fw-bold mb-0">
                    Awards & Distinctions <span className="text-danger">*</span>
                  </h6>
                  {errors.awardsDistinction && (
                    <small className="text-danger">
                      Please fill all award fields
                    </small>
                  )}
                </div>
                <div className="card-body">
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>S.No</th>
                        <th>
                          Award Name <span className="text-danger">*</span>
                        </th>
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
                              className={`form-control ${hasError("awardsDistinction", index, "awardName") ? "is-invalid" : ""}`}
                              value={row.awardName}
                              placeholder="Enter award details (e.g., Best Employee 2023, Research Excellence Award)"
                              onChange={(e) => {
                                handleAwardsDistinctionChange(
                                  index,
                                  "awardName",
                                  e.target.value,
                                );
                                // Auto-update awardSummary for backend
                                if (e.target.value.trim()) {
                                  handleAwardsDistinctionChange(
                                    index,
                                    "awardSummary",
                                    e.target.value,
                                  );
                                }
                              }}
                              onBlur={(e) => {
                                // Ensure awardSummary is updated
                                if (
                                  e.target.value.trim() &&
                                  !row.awardSummary
                                ) {
                                  handleAwardsDistinctionChange(
                                    index,
                                    "awardSummary",
                                    e.target.value,
                                  );
                                }
                              }}
                              maxLength={plength}
                            />
                            {hasError(
                              "awardsDistinction",
                              index,
                              "awardName",
                            ) && (
                              <div className="invalid-feedback">
                                {getErrorMessage(
                                  "awardsDistinction",
                                  index,
                                  "awardName",
                                )}
                              </div>
                            )}
                          </td>
                          <td>
                            {formData.awardsDistinction.length > 1 ? (
                              <button
                                type="button"
                                className="btn btn-danger"
                                onClick={() =>
                                  removeAwardsDistinctionRow(index)
                                }
                                title="Remove award"
                              >
                                <i className="icofont-close"></i>
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-secondary"
                                disabled
                                title="At least one award is required"
                              >
                                <i className="icofont-close"></i>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="d-flex justify-content-between align-items-center">
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={addAwardsDistinctionRow}
                    >
                      <i className="icofont-plus me-1"></i> Add Award
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Required Documents (existing) */}
          <div className="row mb-3">
            <div className="col-sm-12">
              <div className="card shadow mb-3">
                <div className="card-header border-bottom-1 py-3">
                  <h6 className="fw-bold mb-0">
                    Required Documents <span className="text-danger">*</span>
                  </h6>
                  {errors.document && (
                    <small className="text-danger">
                      Please fill all document fields and upload files
                    </small>
                  )}
                </div>
                <div className="card-body">
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>S.No</th>
                        <th>
                          Document Name <span className="text-danger">*</span>
                        </th>
                        <th>
                          File Upload <span className="text-danger">*</span>
                          <small
                            className="text-muted d-block"
                            style={{ fontSize: "10px" }}
                          >
                            Max 1MB
                          </small>
                        </th>
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
                              className={`form-control ${hasError("document", index, "documentName") ? "is-invalid" : ""}`}
                              value={row.documentName}
                              onChange={(e) =>
                                handleDocumentChange(
                                  index,
                                  "documentName",
                                  e.target.value,
                                )
                              }
                              placeholder="Document Name (e.g., Passport, Degree Certificate)"
                              maxLength={plength}
                            />
                            {hasError("document", index, "documentName") && (
                              <div className="invalid-feedback">
                                {getErrorMessage(
                                  "document",
                                  index,
                                  "documentName",
                                )}
                              </div>
                            )}
                          </td>
                          <td>
                            <div>
                              <input
                                type="file"
                                className={`form-control ${hasError("document", index, "filePath") ? "is-invalid" : ""}`}
                                onChange={(e) =>
                                  handleFileWithPreview(e, "document", index)
                                }
                                accept=".pdf,.jpg,.jpeg,.png"
                                style={{ fontSize: "12px", padding: "4px 8px" }}
                              />
                              {hasError("document", index, "filePath") && (
                                <div
                                  className="invalid-feedback"
                                  style={{ fontSize: "11px" }}
                                >
                                  {getErrorMessage(
                                    "document",
                                    index,
                                    "filePath",
                                  )}
                                </div>
                              )}
                              {row.filePath && (
                                <div className="mt-1">
                                  <div className="d-flex align-items-center">
                                    <small
                                      className="text-success"
                                      style={{ fontSize: "10px" }}
                                    >
                                      <i className="icofont-check-circled me-1"></i>
                                      {(
                                        row.fileName || row.filePath.name
                                      ).substring(0, 10)}
                                      {(row.fileName || row.filePath.name)
                                        .length > 10
                                        ? "..."
                                        : ""}
                                    </small>
                                    <div className="d-flex gap-1 ms-auto">
                                      <button
                                        type="button"
                                        className="btn btn-link p-0"
                                        onClick={() => {
                                          openPreview(
                                            row.filePreview,
                                            row.fileType === "application/pdf"
                                              ? "pdf"
                                              : "image",
                                            row.fileName || row.filePath.name,
                                            "qualification",
                                          );
                                        }}
                                        title="Preview file"
                                        style={{
                                          fontSize: "11px",
                                          color: "#0d6efd",
                                          width: "18px",
                                          height: "18px",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                        }}
                                      >
                                        <i className="icofont-eye"></i>
                                      </button>
                                      <a
                                        href={row.filePreview}
                                        download={
                                          row.fileName || row.filePath.name
                                        }
                                        className="btn btn-link p-0"
                                        title="Download file"
                                        style={{
                                          fontSize: "11px",
                                          color: "#198754",
                                          width: "18px",
                                          height: "18px",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                        }}
                                      >
                                        <i className="icofont-download"></i>
                                      </a>
                                      <button
                                        type="button"
                                        className="btn btn-link p-0"
                                        onClick={() => {
                                          setFormData((prev) => ({
                                            ...prev,
                                            qualification:
                                              prev.qualification.map(
                                                (item, i) =>
                                                  i === index
                                                    ? {
                                                        ...item,
                                                        filePath: null,
                                                        filePreview: null,
                                                        fileName: "",
                                                        fileType: "",
                                                      }
                                                    : item,
                                              ),
                                          }));
                                        }}
                                        title="Remove file"
                                        style={{
                                          fontSize: "11px",
                                          color: "#dc3545",
                                          width: "18px",
                                          height: "18px",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                        }}
                                      >
                                        <i className="icofont-close"></i>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            {formData.document.length > 1 ? (
                              <button
                                type="button"
                                className="btn btn-danger"
                                onClick={() => removeDocumentRow(index)}
                                title="Remove document"
                              >
                                <i className="icofont-close"></i>
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-secondary"
                                disabled
                                title="At least one document is required"
                              >
                                <i className="icofont-close"></i>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="d-flex justify-content-between align-items-center">
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={addDocumentRow}
                    >
                      <i className="icofont-plus me-1"></i> Add Document
                    </button>
                  </div>
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
              style={{ minWidth: "120px" }}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </button>
            {/*          <button
              onClick={handleCreateWithApprove}
              type="button"
              className="btn btn-success"
              disabled={loading || !isFormValid()}
              style={{ minWidth: "150px" }}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Processing...
                </>
              ) : (
                "Submit & Approve"
              )}
            </button>*/}
          </div>
        </div>
      </div>
      {/* Preview Modal */}
      {previewModal.show && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              width: "90%",
              height: "90%",
              display: "flex",
              flexDirection: "column",
              position: "relative",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "15px 20px",
                borderBottom: "1px solid #dee2e6",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h6 style={{ margin: 0 }}>
                <i className="icofont-file-alt me-2"></i>
                {previewModal.fileName}
              </h6>
              <div>
                <a
                  href={previewModal.url}
                  download={previewModal.fileName}
                  className="btn btn-sm btn-success me-2"
                  style={{ fontSize: "12px" }}
                >
                  <i className="icofont-download me-1"></i> Download
                </a>
                <button
                  onClick={closePreview}
                  className="btn btn-sm btn-danger"
                  style={{ fontSize: "12px" }}
                >
                  <i className="icofont-close me-1"></i> Close
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div
              style={{
                flex: 1,
                padding: "20px",
                overflow: "auto",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {previewModal.type === "image" ? (
                <img
                  src={previewModal.url}
                  alt={previewModal.fileName}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                  }}
                />
              ) : previewModal.type === "pdf" ? (
                <iframe
                  src={previewModal.url}
                  title={previewModal.fileName}
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                  }}
                />
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    color: "#6c757d",
                  }}
                >
                  <i
                    className="icofont-file-alt"
                    style={{ fontSize: "48px" }}
                  ></i>
                  <p className="mt-3">
                    File preview not available for this file type
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "10px 20px",
                borderTop: "1px solid #dee2e6",
                textAlign: "center",
                fontSize: "12px",
                color: "#6c757d",
              }}
            >
              <div>
                <i className="icofont-info-circle me-1"></i>
                Use mouse wheel to zoom, click and drag to pan
              </div>
            </div>

            {/* Close button (alternative) */}
            <button
              onClick={closePreview}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                background: "none",
                border: "none",
                fontSize: "24px",
                color: "#dc3545",
                cursor: "pointer",
                width: "30px",
                height: "30px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            ></button>
          </div>
        </div>
      )}
    </>
  );
};

export default EmployeeRegistration;  
