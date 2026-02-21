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
import { getRequest } from "../../../../service/apiService";
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

    employmentTypeId: "",
    employeeTypeId: "",
    roleId: "",
    fromDate: "",
    departmentId: "",
    designationId: "",
    totalExperience: "",
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
    fetchDepartmentData();
    fetchGenderData();
    fetchIdTypeData();
    fetchRoleData();
    fetchEmployeeTypeData();
    fetchEmploymentTypeData();
    fetchSpecialtyCenterData();
    fetchLanguageData();
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
      showPopup("Failed to load languages", "error");
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
    fetchStateData(countryCode);
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
    fetchDistrictData(stateCode);
  };

  const handleDistrictChange = (districtId) => {
    setFormData((prevState) => ({
      ...prevState,
      districtId: districtId,
    }));
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
  };

  const handleGenderChange = (gendersId) => {
    setFormData((prevState) => ({
      ...prevState,
      genderId: gendersId,
    }));
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
  };

  const handleEmployeeTypeChange = (empTypeId) => {
    setFormData((prevState) => ({
      ...prevState,
      employeeTypeId: empTypeId,
      designationId: "", // ✅ reset correct field
    }));

    setDesignationData([]);
    setSelectedDesignationId("");

    if (empTypeId) {
      fetchDesignationByEmpTypeData(empTypeId);
    }
  };

  const handleDesignationChange = (designationId) => {
    console.log("Designation Changed to:", designationId);

    setSelectedDesignationId(designationId);
    setFormData((prevState) => {
      console.log("Previous designationId:", prevState.designationId);
      console.log("New designationId being set:", designationId);
      return {
        ...prevState,
        designationId: designationId,
      };
    });
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

  const handleInputMobileChange = (e) => {
    const { id, value } = e.target;
    const numericValue = value.replace(/\D/g, "");
    setFormData((prevData) => ({ ...prevData, [id]: numericValue }));
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));
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
          break;

        default:
          break;
      }
    };
    reader.readAsDataURL(file);
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

  const handleDocumentChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      document: prev.document.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
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

    // Only set specialtySearch for the current row
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
  };

  const handlemembershipsChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      memberships: prev.memberships.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const handleSpecialtyInterestChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      specialtyInterest: prev.specialtyInterest.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const handleAwardsDistinctionChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      awardsDistinction: prev.awardsDistinction.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  // Form Validation
  const validateForm = () => {
    const newErrors = {};

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
      { field: "employmentTypeId", message: "Employment Type is required" },
      { field: "employeeTypeId", message: "Employee Type is required" },
      { field: "roleId", message: "Role is required" },
      { field: "designationId", message: "Designation is required" },
      { field: "totalExperience", message: "Total Experience is required" },
    ];

    basicFields.forEach(({ field, message }) => {
      if (!formData[field] || formData[field].toString().trim() === "") {
        newErrors[field] = message;
      }
    });

    if (
      viewDept &&
      (!formData.departmentId || formData.departmentId.toString().trim() === "")
    ) {
      newErrors.departmentId = "Department is required";
    }
    if (formData.profilePicName) {
      const profileValidation = validateUploadedFile(
        formData.profilePicName,
        "Profile image",
      );
      if (!profileValidation.isValid) {
        newErrors.profilePicName = profileValidation.error;
      }
    } else {
      newErrors.profilePicName = "Profile Image is required";
    }

    if (formData.idDocumentName) {
      const idValidation = validateUploadedFile(
        formData.idDocumentName,
        "ID document",
      );
      if (!idValidation.isValid) {
        newErrors.idDocumentName = idValidation.error;
      }
    } else {
      newErrors.idDocumentName = "ID Document is required";
    }

    // Phone number format validation
    if (formData.mobileNo && formData.mobileNo.length !== 10) {
      newErrors.mobileNo = "Mobile number must be 10 digits";
    }

    // Pincode validation
    if (formData.pincode && formData.pincode.length !== 6) {
      newErrors.pincode = "Pincode must be 6 digits";
    }

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
      if (!qual.filePath) {
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

      // Check specialtyCenterName
      if (
        !center.specialtyCenterName ||
        center.specialtyCenterName.toString().trim() === ""
      ) {
        centerErrors.specialtyCenterName = "Specialty Center Name is required";
      }

      // Check centerId - convert to string first
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

    if (specialtyCenterErrors.length > 0) {
      newErrors.specialtyCenter = specialtyCenterErrors;
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

      // Also validate that we have the language ID
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

    // Required Documents Validation
    const documentErrors = [];
    formData.document.forEach((doc, index) => {
      const docErrors = {};
      if (!doc.documentName || doc.documentName.trim() === "") {
        docErrors.documentName = "Document Name is required";
      }
      if (!doc.filePath) {
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

    // Set errors and return validation result
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      // Show first error in popup
      const firstError = Object.values(newErrors)[0];
      const errorMessage =
        typeof firstError === "object"
          ? Object.values(firstError)[0]
          : firstError;

      showPopup(errorMessage || "Please fill all required fields", "error");

      // Scroll to the first error
      setTimeout(() => {
        const firstErrorField = document.querySelector(".is-invalid");
        if (firstErrorField) {
          firstErrorField.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          firstErrorField.focus();
        }
      }, 100);

      return false;
    }

    // Validate phone number format
    if (formData.mobileNo.length !== 10) {
      showPopup("Mobile number must be 10 digits", "error");
      return false;
    }

    // Validate pincode
    if (formData.pincode.length !== 6) {
      showPopup("Pincode must be 6 digits", "error");
      return false;
    }

    if (formData.profilePicName) {
      const profileValidation = validateUploadedFile(
        formData.profilePicName,
        "Profile image",
      );
      if (!profileValidation.isValid) {
        newErrors.profilePicName = profileValidation.error;
      }
    } else {
      newErrors.profilePicName = "Profile Image is required";
    }

    if (formData.idDocumentName) {
      const idValidation = validateUploadedFile(
        formData.idDocumentName,
        "ID document",
      );
      if (!idValidation.isValid) {
        newErrors.idDocumentName = idValidation.error;
      }
    } else {
      newErrors.idDocumentName = "ID Document is required";
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
      "employeeTypeId",
      "designationId",
      "employmentTypeId",
      "roleId",
      "totalExperience",
    ];

    if (viewDept) {
      requiredFields.push("departmentId");
    }

    const languagesValid =
      formData.languages.length > 0 &&
      formData.languages.every(
        (lang) =>
          lang.languageName &&
          lang.languageName.trim() !== "" &&
          lang.languageIdValue &&
          lang.languageIdValue.toString().trim() !== "",
      );

    const basicFieldsValid = requiredFields.every(
      (field) => formData[field] && formData[field].toString().trim() !== "",
    );

    // Check files
    const filesValid = !!formData.profilePicName && !!formData.idDocumentName;

    // Check arrays - ensure they're not empty and all required fields are filled
    const qualificationValid =
      formData.qualification.length > 0 &&
      formData.qualification.every(
        (qual) =>
          qual.qualificationName &&
          qual.institutionName &&
          qual.completionYear &&
          qual.filePath,
      );

    const specialtyCenterValid =
      formData.specialtyCenter.length > 0 &&
      formData.specialtyCenter.every(
        (center) => center.specialtyCenterName && center.centerId,
      );

    const workExperienceValid =
      formData.workExperiences.length > 0 &&
      formData.workExperiences.every((exp) => exp.organizationName);

    const membershipValid =
      formData.memberships.length > 0 &&
      formData.memberships.every((member) => member.levelName);

    const specialtyInterestValid =
      formData.specialtyInterest.length > 0 &&
      formData.specialtyInterest.every(
        (interest) => interest.specialtyInterestName,
      );

    const awardsValid =
      formData.awardsDistinction.length > 0 &&
      formData.awardsDistinction.every((award) => award.awardName);

    const documentsValid =
      formData.document.length > 0 &&
      formData.document.every((doc) => doc.documentName && doc.filePath);

    return (
      basicFieldsValid &&
      filesValid &&
      qualificationValid &&
      specialtyCenterValid &&
      workExperienceValid &&
      membershipValid &&
      languagesValid &&
      specialtyInterestValid &&
      awardsValid &&
      documentsValid
    );
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
      new Date(formData.dob).toISOString().split("T")[0],
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
      "identificationType",
      formData.identificationType.toString(),
    );
    formDataToSend.append("employeeTypeId", formData.employeeTypeId.toString());
    formDataToSend.append(
      "employmentTypeId",
      formData.employmentTypeId.toString(),
    );
    formDataToSend.append("roleId", formData.roleId.toString());
    formDataToSend.append(
      "fromDate",
      new Date(formData.fromDate).toISOString(),
    );
    formDataToSend.append(
      "profileDescription",
      formData.profileDescription || "",
    );

    // Convert to number
    const yearExp = formData.totalExperience
      ? parseInt(formData.totalExperience, 10)
      : 0;
    formDataToSend.append("yearOfExperience", yearExp.toString());

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
    setFormData(initialFormData);
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
      const response = await fetch(
        `${API_HOST}${CREATE_EMPLOYEE}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataToSend,
        },
      );

      const responseData = await response.json();

      if (!response.ok) {
        // Handle 409 Conflict (duplicate mobile number)
        if (response.status === 409) {
          showPopup(
            responseData.message || "Mobile number already registered",
            "error",
          );
          // Highlight the mobile number field
          setErrors((prev) => ({
            ...prev,
            mobileNo:
              responseData.message ||
              "This mobile number is already registered",
          }));
          // Scroll to mobile number field
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

        // Handle other errors
        let errorMessage = `HTTP error! status: ${response.status}`;
        if (responseData.message) {
          errorMessage = responseData.message;
        }
        throw new Error(errorMessage);
      }

      console.log("Success Response:", responseData);

      if (responseData.status === 200 || responseData.status === 201) {
        showPopup("Employee created successfully", "success");
        handleReset();
      } else {
        throw new Error(responseData.message || "Unknown error occurred");
      }
    } catch (error) {
      console.error("Error creating employee:", error);
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
      const response = await fetch(
        `${API_HOST}${CREATE_APPROVE_EMPLOYEE}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataToSend,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        // Handle 409 Conflict (duplicate mobile number)
        if (response.status === 409) {
          showPopup(
            data.message || "Mobile number already registered",
            "error",
          );
          setErrors((prev) => ({
            ...prev,
            mobileNo:
              data.message || "This mobile number is already registered",
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

        throw new Error(
          data.message || `Failed with status: ${response.status}`,
        );
      }

      showPopup("Employee created and approved successfully", "success");
      handleReset();
    } catch (error) {
      console.error("Error creating and approving employee:", error);
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
                            <label className="form-label">
                              Last Name <span className="text-danger">*</span>
                            </label>
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
                            <label className="form-label">
                              Date of Birth{" "}
                              <span className="text-danger">*</span>
                            </label>
                            <input
                              type="date"
                              required
                              id="dob"
                              value={formData.dob}
                              className="form-control"
                              max={new Date().toISOString().split("T")[0]}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">
                              Gender <span className="text-danger">*</span>
                            </label>
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
                            <label className="form-label">
                              Address <span className="text-danger">*</span>
                            </label>
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
                            <label className="form-label">
                              Country <span className="text-danger">*</span>
                            </label>
                            <select
                              className="form-select"
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
                            <label className="form-label">
                              State <span className="text-danger">*</span>
                            </label>
                            <select
                              className="form-select"
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
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">
                              District <span className="text-danger">*</span>
                            </label>
                            <select
                              className="form-select"
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
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">
                              City <span className="text-danger">*</span>
                            </label>
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
                            <label className="form-label">
                              Pincode <span className="text-danger">*</span>
                            </label>
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
                            <label className="form-label">
                              Mobile No. <span className="text-danger">*</span>
                            </label>
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
                            <label className="form-label">
                              ID Type
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
                                <option
                                  key={idType.identificationTypeId}
                                  value={idType.identificationTypeId}
                                >
                                  {idType.identificationName}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">
                              ID Number <span className="text-danger">*</span>
                            </label>
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
                              className="form-control"
                              accept=".jpg,.jpeg,.png,.pdf"
                              onChange={(e) =>
                                handleFileWithPreview(e, "idDocument")
                              }
                              style={{ fontSize: "12px", padding: "4px 8px" }}
                            />
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
                              className="form-control"
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
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">
                              Registration Number{" "}
                              <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Registration Number"
                              maxLength={mlenght}
                            />
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
                              className="form-select"
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
                          </div>

                          <div className="col-md-4">
                            <label className="form-label">
                              Designation <span className="text-danger">*</span>
                            </label>
                            <select
                              className="form-select"
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
                                  {designation.designationName}{" "}
                                  {/* Adjust field name based on your API response */}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="col-md-4">
                            <label className="form-label">
                              Employment Type{" "}
                              <span className="text-danger">*</span>
                            </label>
                            <select
                              className="form-select"
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
                          </div>

                          <div className="col-md-4">
                            <label className="form-label">
                              Role <span className="text-danger">*</span>
                            </label>
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
                        </div>
                      </div>
                      <div className="col-md-3 d-flex flex-column">
                        <label className="form-label">
                          Profile Image <span className="text-danger">*</span>
                          <small className="text-muted ms-2">
                            (Max 1MB, JPG/PNG)
                          </small>
                        </label>
                        <div className="d-flex flex-column align-items-center border p-2">
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
                            className="form-control mt-2"
                            accept="image/*"
                            onChange={(e) =>
                              handleFileWithPreview(e, "profile")
                            }
                            style={{ fontSize: "12px", padding: "4px 8px" }}
                          />
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
                          Profile Description
                        </label>
                        <div className="form-group col-md-10">
                          <div
                            className="form-label"
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
              disabled={loading || !isFormValid()}
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
            <button
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
            </button>
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
