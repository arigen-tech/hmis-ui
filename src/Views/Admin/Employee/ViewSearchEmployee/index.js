import { CKEditor } from '@ckeditor/ckeditor5-react';
import DecoupledEditor from '@ckeditor/ckeditor5-build-decoupled-document';
import React, { useState, useEffect, useRef } from "react";
import placeholderImage from "../../../../assets/images/placeholder.jpg";
import { MAS_COUNTRY, MAS_DISTRICT, MAS_STATE, MAS_GENDER, MAS_ROLES, MAS_IDENTIFICATION_TYPE, API_HOST, MAS_EMPLOYMENT_TYPE, MAS_USER_TYPE, EMPLOYEE_REGISTRATION, MAS_DESIGNATION, MAS_SPECIALITY_CENTER } from "../../../../config/apiConfig";
import { getRequest, putRequest, postRequestWithFormData, getImageRequest } from "../../../../service/apiService";
import Popup from "../../../../Components/popup";
import LoadingScreen from "../../../../Components/Loading";

const ViewSearchEmployee = () => {
  const initialFormData = {
    profilePicName: null,
    profilePicPreview: null,
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
    designationId: "",
    yearOfExperience: "",

    qualification: [{ employeeQualificationId: 1, institutionName: "", completionYear: "", qualificationName: "", filePath: null }],
    document: [{ employeeDocumentId: 1, documentName: "", filePath: null }],
    specialtyCenter: [{
      specialtyCenterId: 1,
      specialtyCenterName: "",
      centerId: "",
      isPrimary: true
    }],
    workExperiences: [{
      experienceId: 1,
      experienceSummary: ""
    }],
    memberships: [{
      membershipsId: 1,
      membershipSummary: ""
    }],
    specialtyInterest: [{
      interestId: 1,
      interestSummary: ""
    }],
    awardsDistinction: [{
      awardId: 1,
      awardName: ""
    }],

    // NEW FIELD
    profileDescription: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const mlenght = 15;
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [popup, setPopup] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [empUpdateId, setEmpUpdateId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countryData, setCountryData] = useState([]);
  const [stateData, setStateData] = useState([]);
  const [districtData, setDistrictData] = useState([]);
  const [genderData, setGenderData] = useState([]);
  const [countryIds, setCountryIds] = useState("");
  const [stateIds, setStateIds] = useState("");
  const [idTypeData, setIdTypeData] = useState([]);
  const [roleData, setRoleData] = useState([]);
  const [employeeTypeData, setEmployeeTypeData] = useState([]);
  const [employmentTypeData, setEmploymentTypeData] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchMobile, setSearchMobile] = useState("");
  const [searchName, setSearchName] = useState("");
  const [pageInput, setPageInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [imageSrc, setImageSrc] = useState(null);
  const [showDocModal, setShowDocModal] = useState(false);
  const [docUrl, setDocUrl] = useState(null);
  const [docType, setDocType] = useState("");
  const itemsPerPage = 5;

  const [designationData, setDesignationData] = useState([]);
  const [specialtyCenterData, setSpecialtyCenterData] = useState([]);
  const [specialtySearch, setSpecialtySearch] = useState("");
  const [selectedDesignationId, setSelectedDesignationId] = useState("");
  const profileEditorRef = useRef(null);
  const profileInclusionRef = useRef(null);
  const [existingFiles, setExistingFiles] = useState({
    profilePic: null,
    idDocument: null,
    qualifications: [],
    documents: []
  });
  const [previewModal, setPreviewModal] = useState({
    show: false,
    type: '', // 'image' or 'pdf'
    url: '',
    fileName: '',
    section: '' // 'profile', 'id', 'qualification', 'document'
  });

  // Add errors state
  const [errors, setErrors] = useState({});

  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  useEffect(() => {
    fetchEmployeesData();
    fetchCountryData();
    fetchGenderData();
    fetchIdTypeData();
    fetchRoleData();
    fetchEmployeeTypeData();
    fetchEmploymentTypeData();
    fetchSpecialtyCenterData();
  }, []);

  useEffect(() => {
    return () => {
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
      }
      if (docUrl) {
        URL.revokeObjectURL(docUrl);
      }
      if (previewModal.url && previewModal.url.startsWith('blob:')) {
        URL.revokeObjectURL(previewModal.url);
      }
    };
  }, [imageSrc, docUrl, previewModal.url]);

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
      },
    });
  };

  // Helper function to check if field has error
  const hasError = (field, index = null, subField = null) => {
    if (!errors[field]) return '';

    if (index !== null) {
      if (errors[field] && errors[field][index]) {
        if (subField !== null) {
          return errors[field][index][subField] ? 'is-invalid' : '';
        }
        // Check if this index has any error
        return Object.keys(errors[field][index]).length > 0 ? 'is-invalid' : '';
      }
      return '';
    }

    return typeof errors[field] === 'string' && errors[field] ? 'is-invalid' : '';
  };

  // Helper function to get error message
  const getErrorMessage = (field, index = null, subField = null) => {
    if (!errors[field]) return '';

    if (index !== null) {
      if (errors[field] && errors[field][index]) {
        if (subField !== null) {
          return errors[field][index][subField] || '';
        }
        // If it's an object, get the first string value
        if (typeof errors[field][index] === 'object') {
          const firstError = Object.values(errors[field][index])[0];
          return typeof firstError === 'string' ? firstError : '';
        }
        return errors[field][index] || '';
      }
    }

    return typeof errors[field] === 'string' ? errors[field] : '';
  };

  // Validation function - UPDATED with all required sections
  const validateForm = () => {
    const newErrors = {};

    // Basic required fields
    const basicFields = [
      { field: 'firstName', label: 'First Name' },
      { field: 'lastName', label: 'Last Name' },
      { field: 'dob', label: 'Date of Birth' },
      { field: 'genderId', label: 'Gender' },
      { field: 'address1', label: 'Address' },
      { field: 'countryId', label: 'Country' },
      { field: 'stateId', label: 'State' },
      { field: 'districtId', label: 'District' },
      { field: 'city', label: 'City' },
      { field: 'pincode', label: 'Pincode' },
      { field: 'mobileNo', label: 'Mobile Number' },
      { field: 'identificationType', label: 'ID Type' },
      { field: 'registrationNo', label: 'ID Number' },
      { field: 'employeeTypeId', label: 'Employee Type' },
      { field: 'employmentTypeId', label: 'Employment Type' },
      { field: 'roleId', label: 'Role' },
      { field: 'designationId', label: 'Designation' },
    ];

    // Check basic fields
    basicFields.forEach(({ field, label }) => {
      if (!formData[field] || formData[field].toString().trim() === '') {
        newErrors[field] = `${label} is required`;
      }
    });

    // Phone number validation
    if (formData.mobileNo && formData.mobileNo.length !== 10) {
      newErrors.mobileNo = 'Mobile number must be 10 digits';
    }

    // Pincode validation
    if (formData.pincode && formData.pincode.length !== 6) {
      newErrors.pincode = 'Pincode must be 6 digits';
    }

    // Check if either new file is uploaded OR employee already has a file
    if (!formData.profilePicName && !existingFiles.profilePic && !formData.profilePicPreview) {
      newErrors.profilePicName = 'Profile picture is required';
    }

    if (!formData.idDocumentName && !existingFiles.idDocument) {
      newErrors.idDocumentName = 'ID document is required';
    }

    // ========== EDUCATIONAL QUALIFICATION ==========
    const qualificationErrors = [];

    const hasValidQualifications = formData.qualification.some(qual =>
      qual.qualificationName && qual.qualificationName.trim() !== '' ||
      qual.institutionName && qual.institutionName.trim() !== '' ||
      qual.completionYear && qual.completionYear.toString().trim() !== '' ||
      qual.filePath || (existingFiles.qualifications && existingFiles.qualifications[0])
    );

    if (!hasValidQualifications) {
      newErrors.qualification = 'At least one educational qualification is required';
    } else {
      formData.qualification.forEach((qual, index) => {
        const qualErrors = {};

        if (!qual.qualificationName || qual.qualificationName.trim() === '') {
          qualErrors.qualificationName = 'Degree is required';
        }

        if (!qual.institutionName || qual.institutionName.trim() === '') {
          qualErrors.institutionName = 'Institution Name is required';
        }

        const yearStr = qual.completionYear ? String(qual.completionYear) : '';
        if (!yearStr || yearStr.trim() === '' || yearStr.length !== 4) {
          qualErrors.completionYear = 'Valid Year of Completion is required (YYYY)';
        }

        if (!qual.filePath && !existingFiles.qualifications[index]) {
          qualErrors.filePath = 'Qualification file is required';
        }

        if (Object.keys(qualErrors).length > 0) {
          qualificationErrors[index] = qualErrors;
        }
      });

      if (qualificationErrors.length > 0) {
        newErrors.qualification = qualificationErrors;
      }
    }

    // ========== SPECIALTY CENTER NAME ==========
    const hasValidSpecialtyCenters = formData.specialtyCenter.some(center =>
      center.specialtyCenterName && center.specialtyCenterName.trim() !== ''
    );

    if (!hasValidSpecialtyCenters) {
      newErrors.specialtyCenter = 'At least one specialty center is required';
    } else {
      const specialtyCenterErrors = [];
      formData.specialtyCenter.forEach((center, index) => {
        const centerErrors = {};
        if (!center.specialtyCenterName || center.specialtyCenterName.trim() === '') {
          centerErrors.specialtyCenterName = 'Specialty Center Name is required';
        }
        if (Object.keys(centerErrors).length > 0) {
          specialtyCenterErrors[index] = centerErrors;
        }
      });
      if (specialtyCenterErrors.length > 0) {
        newErrors.specialtyCenter = specialtyCenterErrors;
      }
    }

    // ========== WORK EXPERIENCE ==========
    const hasValidWorkExperiences = formData.workExperiences.some(exp =>
      exp.experienceSummary && exp.experienceSummary.trim() !== ''
    );

    if (!hasValidWorkExperiences) {
      newErrors.workExperiences = 'At least one work experience is required';
    } else {
      const workExpErrors = [];
      formData.workExperiences.forEach((exp, index) => {
        const expErrors = {};
        if (!exp.experienceSummary || exp.experienceSummary.trim() === '') {
          expErrors.experienceSummary = 'Work experience details are required';
        }
        if (Object.keys(expErrors).length > 0) {
          workExpErrors[index] = expErrors;
        }
      });
      if (workExpErrors.length > 0) {
        newErrors.workExperiences = workExpErrors;
      }
    }

    // ========== MEMBERSHIPS ==========
    const hasValidMemberships = formData.memberships.some(mem =>
      mem.membershipSummary && mem.membershipSummary.trim() !== ''
    );

    if (!hasValidMemberships) {
      newErrors.memberships = 'At least one membership is required';
    } else {
      const membershipErrors = [];
      formData.memberships.forEach((mem, index) => {
        const memErrors = {};
        if (!mem.membershipSummary || mem.membershipSummary.trim() === '') {
          memErrors.membershipSummary = 'Membership details are required';
        }
        if (Object.keys(memErrors).length > 0) {
          membershipErrors[index] = memErrors;
        }
      });
      if (membershipErrors.length > 0) {
        newErrors.memberships = membershipErrors;
      }
    }

    // ========== SPECIALTY INTEREST ==========
    const hasValidSpecialtyInterests = formData.specialtyInterest.some(interest =>
      interest.interestSummary && interest.interestSummary.trim() !== ''
    );

    if (!hasValidSpecialtyInterests) {
      newErrors.specialtyInterest = 'At least one specialty interest is required';
    } else {
      const interestErrors = [];
      formData.specialtyInterest.forEach((interest, index) => {
        const intErrors = {};
        if (!interest.interestSummary || interest.interestSummary.trim() === '') {
          intErrors.interestSummary = 'Specialty interest details are required';
        }
        if (Object.keys(intErrors).length > 0) {
          interestErrors[index] = intErrors;
        }
      });
      if (interestErrors.length > 0) {
        newErrors.specialtyInterest = interestErrors;
      }
    }

    // ========== AWARDS & DISTINCTIONS ==========
    const hasValidAwards = formData.awardsDistinction.some(award =>
      award.awardName && award.awardName.trim() !== ''
    );

    if (!hasValidAwards) {
      newErrors.awardsDistinction = 'At least one award or distinction is required';
    } else {
      const awardErrors = [];
      formData.awardsDistinction.forEach((award, index) => {
        const awardError = {};
        if (!award.awardName || award.awardName.trim() === '') {
          awardError.awardName = 'Award details are required';
        }
        if (Object.keys(awardError).length > 0) {
          awardErrors[index] = awardError;
        }
      });
      if (awardErrors.length > 0) {
        newErrors.awardsDistinction = awardErrors;
      }
    }

    // ========== REQUIRED DOCUMENTS ==========
    const hasValidDocuments = formData.document.some(doc =>
      doc.documentName && doc.documentName.trim() !== '' ||
      doc.filePath || (existingFiles.documents && existingFiles.documents[0])
    );

    if (!hasValidDocuments) {
      newErrors.document = 'At least one document is required';
    } else {
      const documentErrors = [];
      formData.document.forEach((doc, index) => {
        const docErrors = {};
        if (!doc.documentName || doc.documentName.trim() === '') {
          docErrors.documentName = 'Document Name is required';
        }
        if (!doc.filePath && !existingFiles.documents[index]) {
          docErrors.filePath = 'Document file is required';
        }
        if (Object.keys(docErrors).length > 0) {
          documentErrors[index] = docErrors;
        }
      });
      if (documentErrors.length > 0) {
        newErrors.document = documentErrors;
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      // Find the first error message (string value)
      let errorMessage = "Please fill all required fields";

      // Helper function to extract first string error from nested objects
      const extractFirstStringError = (obj) => {
        if (typeof obj === 'string') {
          return obj;
        }

        if (typeof obj === 'object' && obj !== null) {
          for (let key in obj) {
            const value = obj[key];
            if (typeof value === 'string') {
              return value;
            }
            if (typeof value === 'object' && value !== null) {
              const nestedError = extractFirstStringError(value);
              if (nestedError) return nestedError;
            }
          }
        }
        return null;
      };

      // Try to find the first string error
      for (let key in newErrors) {
        const extractedError = extractFirstStringError(newErrors[key]);
        if (extractedError) {
          errorMessage = extractedError;
          break;
        }
      }

      showPopup(errorMessage, "error");

      // Scroll to first error
      setTimeout(() => {
        const firstErrorField = document.querySelector('.is-invalid');
        if (firstErrorField) {
          firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstErrorField.focus();
        }
      }, 100);

      return false;
    }

    return true;
  };

  const fetchEmployeesData = async () => {
    setLoading(true);
    try {
      const data = await getRequest(`/${EMPLOYEE_REGISTRATION}/getAllEmployee`);
      if (data.status === 200 && Array.isArray(data.response)) {
        setEmployees(data.response);
        setFilteredEmployees(data.response);
      } else {
        console.error("Unexpected API response format:", data);
        setEmployees([]);
        setFilteredEmployees([]);
      }
    } catch (error) {
      console.error("Error fetching Employees data:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const fetchImageSrc = async (empId) => {
    try {
      const imageBlob = await getImageRequest(`/api/employee/getProfileImageSrcInEmployee/${empId}`, {}, "blob");
      const imageUrl = URL.createObjectURL(imageBlob);
      setImageSrc(imageUrl);
    } catch (error) {
      console.error("Error fetching image source", error);
    }
  };

  const fetchDesignationByEmpTypeData = async (employeeTypeId, designationId) => {
    if (!employeeTypeId) return;

    setLoading(true);
    try {
      const data = await getRequest(`${MAS_DESIGNATION}/getById/${employeeTypeId}`);

      if (data?.status === 200 && Array.isArray(data.response)) {
        setDesignationData(data.response);

        if (designationId) {
          const exists = data.response.find(
            d => d.designationId === designationId
          );

          if (exists) {
            setFormData(prev => ({
              ...prev,
              designationId: designationId
            }));
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecialtyCenterData = async () => {
    setLoading(true);
    try {
      const data = await getRequest(`${MAS_SPECIALITY_CENTER}/getAll/1`);
      if (data && data.status === 200 && Array.isArray(data.response)) {
        setSpecialtyCenterData(data.response);
        console.log(data)
      } else {
        console.error("Unexpected API response format:", data);
        setSpecialtyCenterData([]);
      }
    } catch (error) {
      console.error("Error fetching specialty centers:", error);
    } finally {
      setLoading(false);
    }
  };

  const extractFilename = (filePath) => {
    if (!filePath) return '';
    return filePath.split('/').pop().replace(/^\d+_/, ''); // Remove timestamp prefix
  };

  const handleViewDocument = async (filePath) => {
    try {
      const blob = await getImageRequest(`/api/employee/viewDocument?filePath=${encodeURIComponent(filePath)}`, {}, "blob");

      const fileURL = URL.createObjectURL(blob);
      const fileType = blob.type;

      setDocUrl(fileURL);
      setDocType(fileType);
      setShowDocModal(true);

    } catch (error) {
      console.error("Failed to load document:", error);
    }
  };

  // Function to open preview
  const openPreview = (url, type, fileName, section) => {
    setPreviewModal({
      show: true,
      type,
      url,
      fileName,
      section
    });
  };

  // Function to close preview
  const closePreview = () => {
    setPreviewModal({
      show: false,
      type: '',
      url: '',
      fileName: '',
      section: ''
    });
  };

  // Function to handle file input change with preview
  const handleFileWithPreview = (e, section, index = null) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
      showPopup("File size must be less than 5MB", "error");
      e.target.value = '';
      return;
    }

    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      showPopup("Only PDF, JPG, JPEG, PNG files are allowed", "error");
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      switch (section) {
        case 'profile':
          setFormData(prev => ({
            ...prev,
            profilePicName: file,
            profilePicPreview: reader.result,
          }));
          // Clear existing file when new file is selected
          setExistingFiles(prev => ({ ...prev, profilePic: null }));
          setErrors(prev => ({ ...prev, profilePicName: '' }));
          break;

        case 'idDocument':
          setFormData(prev => ({
            ...prev,
            idDocumentName: file,
          }));
          // Clear existing file when new file is selected
          setExistingFiles(prev => ({ ...prev, idDocument: null }));
          setErrors(prev => ({ ...prev, idDocumentName: '' }));
          break;

        case 'qualification':
          setFormData(prev => ({
            ...prev,
            qualification: prev.qualification.map((item, i) =>
              i === index ? {
                ...item,
                filePath: file,
              } : item
            )
          }));
          // Clear existing file when new file is selected
          setExistingFiles(prev => {
            const newQualifications = [...prev.qualifications];
            newQualifications[index] = null;
            return { ...prev, qualifications: newQualifications };
          });
          setErrors(prev => {
            const newErrors = { ...prev };
            if (newErrors.qualification && newErrors.qualification[index]) {
              delete newErrors.qualification[index].filePath;
            }
            return newErrors;
          });
          break;

        case 'document':
          setFormData(prev => ({
            ...prev,
            document: prev.document.map((item, i) =>
              i === index ? {
                ...item,
                filePath: file,
              } : item
            )
          }));
          // Clear existing file when new file is selected
          setExistingFiles(prev => {
            const newDocuments = [...prev.documents];
            newDocuments[index] = null;
            return { ...prev, documents: newDocuments };
          });
          setErrors(prev => {
            const newErrors = { ...prev };
            if (newErrors.document && newErrors.document[index]) {
              delete newErrors.document[index].filePath;
            }
            return newErrors;
          });
          break;

        default:
          break;
      }
    };
    reader.readAsDataURL(file);
  };

  // Helper function to create blob URL for viewing existing files
  const createViewUrl = (filePath) => {
    return `${API_HOST}/api/employee/viewDocument?filePath=${encodeURIComponent(filePath)}`;
  };

  const handleCountryChange = (id) => {
    setFormData((prevState) => ({
      ...prevState,
      countryId: id,
      stateId: "",
      districtId: "",
    }));
    setErrors(prev => ({ ...prev, countryId: '', stateId: '', districtId: '' }));
    fetchStateData(id);
  };

  const handleStateChange = (id) => {
    setFormData((prevState) => ({
      ...prevState,
      stateId: id,
      districtId: "",
    }));
    setErrors(prev => ({ ...prev, stateId: '', districtId: '' }));
    fetchDistrictData(id);
  };

  const handleDistrictChange = (districtId) => {
    setFormData((prevState) => ({
      ...prevState,
      districtId: districtId,
    }));
    setErrors(prev => ({ ...prev, districtId: '' }));
  };

  const handleGenderChange = (gendersId) => {
    setFormData((prevState) => ({
      ...prevState,
      genderId: gendersId,
    }));
    setErrors(prev => ({ ...prev, genderId: '' }));
  };

  const handleEmploymentTypeChange = (emptTypeId) => {
    setFormData((prevState) => ({
      ...prevState,
      employmentTypeId: emptTypeId,
    }));
    setErrors(prev => ({ ...prev, employmentTypeId: '' }));
  };

  const handleEmployeeTypeChange = (empTypeId) => {
    setFormData((prevState) => ({
      ...prevState,
      employeeTypeId: empTypeId,
      designationId: "",
    }));
    setErrors(prev => ({ ...prev, employeeTypeId: '', designationId: '' }));
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
    setErrors(prev => ({ ...prev, designationId: '' }));
  };

  const handleProfileEditorChange = (event, editor) => {
    const data = editor.getData();
    setFormData(prev => ({ ...prev, profileDescription: data }));
  };

  const addSpecialtyCenterRow = () => {
    setFormData((prev) => ({
      ...prev,
      specialtyCenter: [
        ...prev.specialtyCenter,
        {
          specialtyCenterId: prev.specialtyCenter.length + 1,
          specialtyCenterName: "",
          centerId: "",
          isPrimary: false,
        },
      ],
    }));
  };

  const removeSpecialtyCenterRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      specialtyCenter: prev.specialtyCenter.filter((_, i) => i !== index),
    }));
  };

  const addWorkExperienceRow = () => {
    setFormData((prev) => ({
      ...prev,
      workExperiences: [
        ...prev.workExperiences,
        { experienceId: prev.workExperiences.length + 1, experienceSummary: "" },
      ],
    }));
  };

  const removeWorkExperienceRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      workExperiences: prev.workExperiences.filter((_, i) => i !== index),
    }));
  };

  const addmembershipsRow = () => {
    setFormData((prev) => ({
      ...prev,
      memberships: [
        ...prev.memberships,
        { membershipsId: prev.memberships.length + 1, membershipSummary: "" },
      ],
    }));
  };
  const removemembershipsRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      memberships: prev.memberships.filter((_, i) => i !== index),
    }));
  };

  const addSpecialtyInterestRow = () => {
    setFormData((prev) => ({
      ...prev,
      specialtyInterest: [
        ...prev.specialtyInterest,
        { interestId: prev.specialtyInterest.length + 1, interestSummary: "" },
      ],
    }));
  };
  const removeSpecialtyInterestRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      specialtyInterest: prev.specialtyInterest.filter((_, i) => i !== index),
    }));
  };

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

  // Change handlers for new sections
  const handleSpecialtyCenterChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      specialtyCenter: prev.specialtyCenter.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
    if (field === "specialtyCenterName") {
      setFormData(prev => ({
        ...prev,
        specialtyCenter: prev.specialtyCenter.map((item, i) =>
          i === index ? { ...item, searchTerm: value } : item
        )
      }));
    }
  };
  const handleWorkExperienceChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      workExperiences: prev.workExperiences.map((item, i) =>
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

  const handleRoleChange = (role) => {
    setFormData((prevState) => ({
      ...prevState,
      roleId: role,
    }));
    setErrors(prev => ({ ...prev, roleId: '' }));
  };

  const handleIdTypeChange = (idTypeId) => {
    setFormData((prevState) => ({
      ...prevState,
      identificationType: idTypeId,
    }));
    setErrors(prev => ({ ...prev, identificationType: '' }));
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
      setErrors(prev => ({ ...prev, profilePicName: '' }));
    }
  };

  const handleQualificationChange = (index, field, value) => {
    if (field === "filePath" && value instanceof File) {
      setExistingFiles(prev => {
        const newQualifications = [...prev.qualifications];
        newQualifications[index] = null;
        return { ...prev, qualifications: newQualifications };
      });
      setErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors.qualification && newErrors.qualification[index]) {
          delete newErrors.qualification[index].filePath;
        }
        return newErrors;
      });
    }

    setFormData(prev => ({
      ...prev,
      qualification: prev.qualification.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeEducationRow = (index) => {
    setFormData(prev => ({
      ...prev,
      qualification: prev.qualification.filter((_, i) => i !== index),
    }));
  };

  const addEducationRow = (e) => {
    e.preventDefault();
    setFormData(prev => ({
      ...prev,
      qualification: [
        ...prev.qualification,
        {
          employeeQualificationId: null,
          institutionName: "",
          completionYear: "",
          qualificationName: "",
          filePath: null,
        },
      ],
    }));
  };

  const handleDocumentChange = (index, field, value) => {
    if (field === "filePath" && value instanceof File) {
      setExistingFiles(prev => {
        const newDocuments = [...prev.documents];
        newDocuments[index] = null;
        return { ...prev, documents: newDocuments };
      });
      setErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors.document && newErrors.document[index]) {
          delete newErrors.document[index].filePath;
        }
        return newErrors;
      });
    }

    setFormData(prev => ({
      ...prev,
      document: prev.document.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addDocumentRow = (e) => {
    e.preventDefault();
    setFormData(prev => ({
      ...prev,
      document: [
        ...prev.document,
        { employeeDocumentId: null, documentName: "", filePath: null },
      ],
    }));
  };

  const removeDocumentRow = (index) => {
    setFormData(prev => ({
      ...prev,
      document: prev.document.filter((_, i) => i !== index),
    }));
  };

  const fetchEmployeeById = async (employeeId) => {
    setLoading(true);
    try {
      const data = await getRequest(`/${EMPLOYEE_REGISTRATION}/employee/${employeeId}`);
      if (data.status === 200 && data.response) {
        return data.response;
      }
      return null;
    } catch (error) {
      console.error("Error fetching employee details:", error);
      showPopup("Failed to load employee details", "error");
      return null;
    } finally {
      setLoading(false);
    }
  }

  const handleAnotherAction = async (employee) => {
    setEditingEmployee(employee);
    setShowForm(true);
    setEmpUpdateId(employee.employeeId);

    // Clear any existing errors
    setErrors({});

    // Fetch COMPLETE employee data from backend
    const completeEmployeeData = await fetchEmployeeById(employee.employeeId);

    if (!completeEmployeeData) {
      showPopup("Failed to load employee data", "error");
      return;
    }

    console.log("Complete employee data:", completeEmployeeData);

    // Fetch and store ACTUAL FILES (not just paths)
    const [profilePicFile, idDocumentFile] = await Promise.all([
      completeEmployeeData.profilePicName ?
        fetchFileFromPath(completeEmployeeData.profilePicName) : null,
      completeEmployeeData.idDocumentName ?
        fetchFileFromPath(completeEmployeeData.idDocumentName) : null
    ]);

    // Fetch qualifications files
    const qualificationFiles = await Promise.all(
      (completeEmployeeData.qualifications || []).map(async (q) =>
        q.filePath ? await fetchFileFromPath(q.filePath) : null
      )
    );

    // Fetch documents files
    const documentFiles = await Promise.all(
      (completeEmployeeData.documents || []).map(async (d) =>
        d.filePath ? await fetchFileFromPath(d.filePath) : null
      )
    );

    // Set basic form data from COMPLETE data
    const newFormData = {
      ...initialFormData,
      // Set the fetched files directly
      profilePicName: profilePicFile,
      idDocumentName: idDocumentFile,

      // Set preview for profile image
      profilePicPreview: profilePicFile ?
        URL.createObjectURL(profilePicFile) : null,

      firstName: completeEmployeeData.firstName || "",
      middleName: completeEmployeeData.middleName || "",
      lastName: completeEmployeeData.lastName || "",
      dob: completeEmployeeData.dob ? completeEmployeeData.dob.slice(0, 10) : "",
      genderId: completeEmployeeData.genderId || "",
      address1: completeEmployeeData.address1 || "",
      countryId: completeEmployeeData.countryId || "",
      stateId: completeEmployeeData.stateId || "",
      districtId: completeEmployeeData.districtId || "",
      city: completeEmployeeData.city || "",
      pincode: completeEmployeeData.pincode || "",
      mobileNo: completeEmployeeData.mobileNo || "",
      identificationType: completeEmployeeData.identificationTypeId || "",
      registrationNo: completeEmployeeData.registrationNo || "",
      employmentTypeId: completeEmployeeData.employmentTypeId || "",
      employeeTypeId: completeEmployeeData.employeeTypeId || "",
      roleId: completeEmployeeData.roleId || "",
      fromDate: completeEmployeeData.fromDate ? completeEmployeeData.fromDate.slice(0, 10) : "",
      designationId: completeEmployeeData.masDesignationId || completeEmployeeData.designationId || "",
      yearOfExperience: completeEmployeeData.yearOfExperience ?? "",
      profileDescription: completeEmployeeData.profileDescription || "",
    };

    // Set specialty centers if available
    if (completeEmployeeData.specialtyCenters?.length) {
      newFormData.specialtyCenter = completeEmployeeData.specialtyCenters.map((sc, index) => ({
        specialtyCenterId: index + 1,
        centerId: sc.centerId,
        specialtyCenterName: getSpecialtyNameById(sc.centerId),
        isPrimary: sc.isPrimary ?? index === 0,
        searchTerm: ""
      }));
    }

    // Set work experiences if available
    if (completeEmployeeData.workExperiences?.length) {
      newFormData.workExperiences = completeEmployeeData.workExperiences.map((we, index) => ({
        experienceId: we.experienceId || index + 1,
        experienceSummary: we.experienceSummary || ""
      }));
    }

    // Set memberships if available
    if (completeEmployeeData.memberships?.length) {
      newFormData.memberships = completeEmployeeData.memberships.map((mem, index) => ({
        membershipsId: mem.membershipId || index + 1,
        membershipSummary: mem.membershipSummary || ""
      }));
    }

    // Set specialty interests if available
    if (completeEmployeeData.specialtyInterests?.length) {
      newFormData.specialtyInterest = completeEmployeeData.specialtyInterests.map((si, index) => ({
        interestId: si.interestId || index + 1,
        interestSummary: si.interestSummary || ""
      }));
    }

    // Set awards if available
    if (completeEmployeeData.awards?.length) {
      newFormData.awardsDistinction = completeEmployeeData.awards.map((award, index) => ({
        awardId: award.awardId || index + 1,
        awardName: award.awardSummary || ""
      }));
    }

    // Set qualifications with actual files
    if (completeEmployeeData.qualifications?.length) {
      newFormData.qualification = completeEmployeeData.qualifications.map((q, index) => ({
        employeeQualificationId: q.employeeQualificationId,
        institutionName: q.institutionName || "",
        completionYear: q.completionYear || "",
        qualificationName: q.qualificationName || "",
        filePath: qualificationFiles[index] || null,
      }));
    }

    // Set documents with actual files
    if (completeEmployeeData.documents?.length) {
      newFormData.document = completeEmployeeData.documents.map((d, index) => ({
        employeeDocumentId: d.employeeDocumentId,
        documentName: d.documentName || "",
        filePath: documentFiles[index] || null,
      }));
    }

    setFormData(newFormData);

    // Store the original file paths for reference
    setExistingFiles({
      profilePic: completeEmployeeData.profilePicName,
      idDocument: completeEmployeeData.idDocumentName,
      qualifications: completeEmployeeData.qualifications?.map(q => q.filePath) || [],
      documents: completeEmployeeData.documents?.map(d => d.filePath) || []
    });

    // Fetch dependent data
    if (completeEmployeeData.countryId) {
      await fetchStateData(completeEmployeeData.countryId);

      if (completeEmployeeData.stateId) {
        await fetchDistrictData(completeEmployeeData.stateId);
      }
    }

    if (completeEmployeeData.employeeTypeId) {
      await fetchDesignationByEmpTypeData(
        completeEmployeeData.employeeTypeId,
        completeEmployeeData.masDesignationId || completeEmployeeData.designationId
      );
    }
  };

  // Helper function to fetch file from server path
  const fetchFileFromPath = async (filePath) => {
    if (!filePath) return null;

    try {
      // Extract filename from path
      const filename = filePath.split('/').pop();

      // Use your existing viewDocument endpoint
      const response = await fetch(`${API_HOST}/api/employee/viewDocument?filePath=${encodeURIComponent(filePath)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error(`Failed to fetch file: ${filePath}`, response.status);
        return null;
      }

      const blob = await response.blob();

      // Create a File object from the blob
      return new File([blob], filename, { type: blob.type });
    } catch (error) {
      console.error(`Error fetching file ${filePath}:`, error);
      return null;
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));
    // Clear error when user starts typing
    setErrors(prev => ({ ...prev, [id]: '' }));
  };

  const getSpecialtyNameById = (centerId) => {
    if (!centerId) return "";
    const center = specialtyCenterData.find(
      c => String(c.centerId) === String(centerId)
    );
    return center ? (center.centerName || center.specialtyCenterName || "") : "";
  };

  const getSpecialtyCenterNameById = (centerId) => {
    if (!centerId) return "";
    const center = specialtyCenterData.find(c => String(c.centerId) === String(centerId));
    return center ? (center.centerName || center.specialtyCenterName || "") : "";
  };

  const handleInputMobileChange = (e) => {
    const { id, value } = e.target;
    const numericValue = value.replace(/\D/g, '');
    setFormData((prevData) => ({ ...prevData, [id]: numericValue }));
    // Clear error when user starts typing
    setErrors(prev => ({ ...prev, [id]: '' }));
  };

  const handleSearch = () => {
    const lowerName = searchName.toLowerCase();
    const filtered = employees.filter(emp => {
      const fullName = `${emp.firstName} ${emp.middleName} ${emp.lastName}`.toLowerCase();
      return (
        (searchMobile === "" || emp.mobileNo.includes(searchMobile)) &&
        (searchName === "" || fullName.includes(lowerName))
      );
    });
    setFilteredEmployees(filtered);
  };

  const handleShowAll = () => {
    setFilteredEmployees(employees);
    setSearchMobile("");
    setSearchName("");
  };

  const filteredTotalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

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

  const handlePageNavigation = () => {
    const pageNumber = parseInt(pageInput, 10);
    if (pageNumber > 0 && pageNumber <= filteredTotalPages) {
      setCurrentPage(pageNumber);
    } else {
      alert("Please enter a valid page number.");
    }
  };

  const currentItems = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const resetForm = () => {
    setFormData(initialFormData);
    setExistingFiles({
      profilePic: null,
      idDocument: null,
      qualifications: [],
      documents: []
    });
    setErrors({});
    setShowForm(false);
    setEditingEmployee(null);
    setImageSrc(null);
  };

  const prepareFormData = () => {
    if (!validateForm()) {
      return null;
    }

    const formDataToSend = new FormData();

    console.log("=== PREPARING FORM DATA ===");
    console.log("Existing files:", existingFiles);

    // Basic info
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
    formDataToSend.append('employeeTypeId', formData.employeeTypeId);
    formDataToSend.append('employmentTypeId', formData.employmentTypeId);
    formDataToSend.append('roleId', formData.roleId);
    formDataToSend.append('fromDate', new Date(formData.fromDate).toISOString());
    formDataToSend.append('profileDescription', formData.profileDescription || "");
    formDataToSend.append('yearOfExperience', formData.yearOfExperience || "");

    if (formData.designationId) {
      formDataToSend.append('masDesignationId', formData.designationId);
    }

    // ========== HANDLE FILES ==========

    // 1. Profile Picture
    if (formData.profilePicName instanceof File) {
      console.log('Adding new profile pic file');
      formDataToSend.append('profilePicName', formData.profilePicName);
    } else if (existingFiles.profilePic) {
      console.log('Sending existing profile pic path:', existingFiles.profilePic);
      // Send the file path as a string - NOT as a file
      formDataToSend.append('profilePicPath', existingFiles.profilePic);
    }

    // 2. ID Document
    if (formData.idDocumentName instanceof File) {
      console.log('Adding new ID document file');
      formDataToSend.append('idDocumentName', formData.idDocumentName);
    } else if (existingFiles.idDocument) {
      console.log('Sending existing ID document path:', existingFiles.idDocument);
      // Send the file path as a string - NOT as a file
      formDataToSend.append('idDocumentPath', existingFiles.idDocument);
    }

    // ========== QUALIFICATIONS ==========
    formData.qualification.forEach((qual, index) => {
      // Send existing ID if available
      if (qual.employeeQualificationId && qual.employeeQualificationId !== 1) {
        formDataToSend.append(`qualification[${index}].employeeQualificationId`,
          qual.employeeQualificationId.toString());
      }

      formDataToSend.append(`qualification[${index}].institutionName`, qual.institutionName || '');
      formDataToSend.append(`qualification[${index}].completionYear`, qual.completionYear || '');
      formDataToSend.append(`qualification[${index}].qualificationName`, qual.qualificationName || '');

      // Handle qualification file
      if (qual.filePath instanceof File) {
        console.log(`Adding new qualification file at index ${index}`);
        formDataToSend.append(`qualification[${index}].filePath`, qual.filePath);
      } else if (qual.filePath && typeof qual.filePath === 'string') {
        // Existing file path - send as string
        console.log(`Sending existing qualification file path at index ${index}:`, qual.filePath);
        formDataToSend.append(`qualification[${index}].filePath`, qual.filePath);
      }
    });

    // ========== DOCUMENTS ==========
    formData.document.forEach((doc, index) => {
      // Send existing ID if available
      if (doc.employeeDocumentId && doc.employeeDocumentId !== 1) {
        formDataToSend.append(`document[${index}].employeeDocumentId`,
          doc.employeeDocumentId.toString());
      }

      formDataToSend.append(`document[${index}].documentName`, doc.documentName || '');

      // Handle document file
      if (doc.filePath instanceof File) {
        console.log(`Adding new document file at index ${index}`);
        formDataToSend.append(`document[${index}].filePath`, doc.filePath);
      } else if (doc.filePath && typeof doc.filePath === 'string') {
        // Existing file path - send as string
        console.log(`Sending existing document file path at index ${index}:`, doc.filePath);
        formDataToSend.append(`document[${index}].filePath`, doc.filePath);
      }
    });

    // ========== OTHER ARRAYS ==========

    // Specialty Center
    formData.specialtyCenter.forEach((center, index) => {
      formDataToSend.append(`specialtyCenter[${index}].specialtyCenterName`,
        center.specialtyCenterName || '');
      formDataToSend.append(`specialtyCenter[${index}].centerId`, center.centerId || '');
      formDataToSend.append(`specialtyCenter[${index}].isPrimary`, (index === 0).toString());
    });

    // Work Experiences
    formData.workExperiences.forEach((exp, index) => {
      // Send existing ID if available
      if (exp.experienceId && exp.experienceId !== 1) {
        formDataToSend.append(`workExperiences[${index}].experienceId`,
          exp.experienceId.toString());
      }

      formDataToSend.append(`workExperiences[${index}].experienceSummary`, exp.experienceSummary || '');
    });

    // Memberships
    formData.memberships.forEach((mem, index) => {
      // Send existing ID if available
      const existingId = mem.membershipId || mem.membershipsId;

      if (existingId && existingId !== 1) {
        formDataToSend.append(`employeeMemberships[${index}].membershipId`, existingId.toString());
      }

      const membershipSummary = mem.membershipSummary || '';
      console.log(`Membership ${index}: summary = "${membershipSummary}"`);
      formDataToSend.append(`employeeMemberships[${index}].membershipSummary`, membershipSummary);
    });

    // Specialty Interest
    formData.specialtyInterest.forEach((interest, index) => {
      // Send existing ID if available
      if (interest.interestId && interest.interestId !== 1) {
        formDataToSend.append(`employeeSpecialtyInterests[${index}].interestId`, interest.interestId.toString());
      }

      const interestSummary = interest.interestSummary || '';
      console.log(`Specialty Interest ${index}: summary = "${interestSummary}"`);
      formDataToSend.append(`employeeSpecialtyInterests[${index}].interestSummary`, interestSummary);
    });

    // Awards
    formData.awardsDistinction.forEach((award, index) => {
      // Send existing ID if available
      if (award.awardId && award.awardId !== 1) {
        formDataToSend.append(`employeeAwards[${index}].awardId`,
          award.awardId.toString());
      }

      formDataToSend.append(`employeeAwards[${index}].awardSummary`, award.awardName || '');
    });

    console.log("=== FINAL FORM DATA SUMMARY ===");
    console.log("Total entries:", Array.from(formDataToSend.entries()).length);

    return formDataToSend;
  };

  const handleSave = async () => {
    const formDataToSend = prepareFormData();
    if (!formDataToSend) return;
    console.log("Form data to send:", formDataToSend);
    setLoading(true);
    try {
      const response = await fetch(`${API_HOST}/${EMPLOYEE_REGISTRATION}/employee/${empUpdateId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (response.ok) {
        showPopup("Employee updated successfully", "success");
        resetForm();
      } else {
        showPopup(`Error: ${data.message || 'Failed to update employee'}`, "error");
      }
    } catch (error) {
      console.error("Error updating employee:", error);
      showPopup("Error submitting form. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="body d-flex py-3">
      <div className="container-xxl">
        <div className="row align-items-center">
          <div className="border-0 mb-4">
            {popupMessage && (
              <Popup
                message={popupMessage.message}
                type={popupMessage.type}
                onClose={popupMessage.onClose}
              />
            )}
            {loading && <LoadingScreen />}

            <div className="card-header py-3 bg-transparent d-flex align-items-center px-0 justify-content-between border-bottom flex-wrap">
              <h3 className="fw-bold mb-0">Update Employee</h3>

              <button className="btn btn-secondary ms-auto me-3" onClick={ () => {
                resetForm();
              } }>
                <i className="icofont-arrow-left me-1"></i> Back to Search
              </button>
            </div>
          </div>
        </div>

        {!showForm ? (
          <div className="row">
            <div className="col-sm-12">
              <div className="card shadow">
                <div className="card-body">
                  {/* Search Section */}
                  <div className="row mb-4">
                    <div className="col-md-3">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Mobile Number"
                        value={searchMobile}
                        onChange={(e) => setSearchMobile(e.target.value)}
                      />
                    </div>
                    <div className="col-md-4">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Employee Name"
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                      />
                    </div>
                    <div className="col-md-2">
                      <button className="btn btn-primary w-100" onClick={handleSearch}>Search</button>
                    </div>
                    <div className="col-md-2">
                      <button className="btn btn-warning w-100" onClick={handleShowAll}>Show All</button>
                    </div>
                  </div>

                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>S.N.</th>
                        <th>Employee Name</th>
                        <th>Gender</th>
                        <th>Date Of Birth</th>
                        <th>Mobile No</th>
                        <th>Type Of Employee</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Edit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmployees.length > 0 ? (
                        currentItems.map((employee, index) => (
                          <tr key={index}>
                            <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                            <td>{employee.firstName} {employee.middleName} {employee.lastName}</td>
                            <td>{employee.gender}</td>
                            <td>{employee.dob}</td>
                            <td>{employee.mobileNo}</td>
                            <td>{employee.employeeType}</td>
                            <td>{employee.role}</td>
                            <td>
                              {employee.status === "A" ? (
                                <i className="fa fa-check-circle text-success fa-2x"></i>
                              ) : (
                                <i className="fa fa-times-circle fa-2x text-danger"></i>
                              )}
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => handleAnotherAction(employee)}
                                disabled={employee.status !== "S"}
                              >
                                <i className="fa fa-pencil"></i>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (<tr>
                        <td colSpan="7" className="text-center text-danger">
                          No Record Found
                        </td>
                      </tr>)}

                    </tbody>
                  </table>

                  <nav className="d-flex justify-content-between align-items-center mt-3">
                    <div>
                      <span>
                        Page {currentPage} of {filteredTotalPages} | Total Records: {filteredEmployees.length}
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
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }} className="forms row">

            <div className="g-3 row">
              <div className="col-md-9">
                <div className="g-3 row">
                  <div className="col-md-4">
                    <label className="form-label">First Name *</label>
                    <input
                      type="text"
                      required
                      className={`form-control ${hasError('firstName')}`}
                      id="firstName"
                      placeholder="First Name"
                      onChange={handleInputChange}
                      value={formData.firstName}
                      maxLength={mlenght}
                    />
                    {getErrorMessage('firstName') && (
                      <div className="invalid-feedback">{getErrorMessage('firstName')}</div>
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
                    <label className="form-label">Last Name *</label>
                    <input
                      type="text"
                      required
                      className={`form-control ${hasError('lastName')}`}
                      id="lastName"
                      placeholder="Last Name"
                      onChange={handleInputChange}
                      value={formData.lastName}
                      maxLength={mlenght}
                    />
                    {getErrorMessage('lastName') && (
                      <div className="invalid-feedback">{getErrorMessage('lastName')}</div>
                    )}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Date of Birth *</label>
                    <input
                      type="date"
                      required
                      id="dob"
                      value={formData.dob}
                      className={`form-control ${hasError('dob')}`}
                      onChange={handleInputChange}
                    />
                    {getErrorMessage('dob') && (
                      <div className="invalid-feedback">{getErrorMessage('dob')}</div>
                    )}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Gender *</label>
                    <select
                      className={`form-select ${hasError('genderId')}`}
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
                    {getErrorMessage('genderId') && (
                      <div className="invalid-feedback">{getErrorMessage('genderId')}</div>
                    )}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Address *</label>
                    <textarea
                      required
                      id="address1"
                      value={formData.address1}
                      className={`form-control ${hasError('address1')}`}
                      onChange={handleInputChange}
                      placeholder="Address"
                    ></textarea>
                    {getErrorMessage('address1') && (
                      <div className="invalid-feedback">{getErrorMessage('address1')}</div>
                    )}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Country *</label>
                    <select
                      className={`form-select ${hasError('countryId')}`}
                      value={formData.countryId}
                      onChange={(e) => {
                        const selectedCountry = countryData.find(
                          (country) => country.id.toString() === e.target.value
                        );
                        if (selectedCountry) {
                          handleCountryChange(selectedCountry.id);
                          setCountryIds(selectedCountry.id);
                          fetchStateData(selectedCountry.id);
                        }
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
                    {getErrorMessage('countryId') && (
                      <div className="invalid-feedback">{getErrorMessage('countryId')}</div>
                    )}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">State *</label>
                    <select
                      className={`form-select ${hasError('stateId')}`}
                      value={formData.stateId}
                      onChange={(e) => {
                        const selectedState = stateData.find(
                          (state) => state.id.toString() === e.target.value
                        );
                        if (selectedState) {
                          handleStateChange(selectedState.id);
                          setStateIds(selectedState.id);
                          fetchDistrictData(selectedState.id);
                        }
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
                    {getErrorMessage('stateId') && (
                      <div className="invalid-feedback">{getErrorMessage('stateId')}</div>
                    )}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">District *</label>
                    <select
                      className={`form-select ${hasError('districtId')}`}
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
                    {getErrorMessage('districtId') && (
                      <div className="invalid-feedback">{getErrorMessage('districtId')}</div>
                    )}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">City *</label>
                    <input
                      type="text"
                      required
                      className={`form-control ${hasError('city')}`}
                      id="city"
                      placeholder="City"
                      onChange={handleInputChange}
                      value={formData.city}
                      maxLength={mlenght}
                    />
                    {getErrorMessage('city') && (
                      <div className="invalid-feedback">{getErrorMessage('city')}</div>
                    )}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Pincode *</label>
                    <input
                      type="text"
                      required
                      className={`form-control ${hasError('pincode')}`}
                      id="pincode"
                      placeholder="Pincode"
                      onChange={handleInputMobileChange}
                      value={formData.pincode}
                      maxLength={6}
                      minLength={6}
                      inputMode="numeric"
                      pattern="\d*"
                    />
                    {getErrorMessage('pincode') && (
                      <div className="invalid-feedback">{getErrorMessage('pincode')}</div>
                    )}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Mobile No. *</label>
                    <input
                      type="text"
                      required
                      className={`form-control ${hasError('mobileNo')}`}
                      id="mobileNo"
                      placeholder="Mobile No."
                      onChange={handleInputMobileChange}
                      value={formData.mobileNo}
                      maxLength={10}
                      minLength={10}
                      inputMode="numeric"
                      pattern="\d*"
                    />
                    {getErrorMessage('mobileNo') && (
                      <div className="invalid-feedback">{getErrorMessage('mobileNo')}</div>
                    )}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">ID Type *</label>
                    <select
                      className={`form-select ${hasError('identificationType')}`}
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
                    {getErrorMessage('identificationType') && (
                      <div className="invalid-feedback">{getErrorMessage('identificationType')}</div>
                    )}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">ID Number *</label>
                    <input
                      type="text"
                      required
                      className={`form-control ${hasError('registrationNo')}`}
                      id="registrationNo"
                      placeholder="ID Number"
                      onChange={handleInputChange}
                      value={formData.registrationNo}
                      maxLength={mlenght}
                    />
                    {getErrorMessage('registrationNo') && (
                      <div className="invalid-feedback">{getErrorMessage('registrationNo')}</div>
                    )}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">ID Upload (JPEG/PDF) *</label>
                    <div className="position-relative">
                      <input
                        type="file"
                        id="idDocumentName"
                        className={`form-control ${hasError('idDocumentName')}`}
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={(e) => handleFileWithPreview(e, 'idDocument')}
                        style={{ fontSize: '12px', padding: '4px 8px' }}
                      />
                      {getErrorMessage('idDocumentName') && (
                        <div className="invalid-feedback">{getErrorMessage('idDocumentName')}</div>
                      )}

                      {/* File actions */}
                      {(formData.idDocumentName || existingFiles.idDocument) && (
                        <div className="d-flex justify-content-between align-items-center mt-1">
                          <small className="text-muted" style={{ fontSize: '11px' }}>
                            <i className="icofont-check-circled me-1"></i>
                            {formData.idDocumentName instanceof File
                              ? formData.idDocumentName.name.substring(0, 15)
                              : extractFilename(existingFiles.idDocument).substring(0, 15)}
                            {(formData.idDocumentName instanceof File
                              ? formData.idDocumentName.name.length > 15
                              : extractFilename(existingFiles.idDocument).length > 15) ? '...' : ''}
                          </small>
                          <div className="d-flex gap-1">
                            <button
                              type="button"
                              className="btn btn-link p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (formData.idDocumentName instanceof File) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    openPreview(
                                      reader.result,
                                      formData.idDocumentName.type === 'application/pdf' ? 'pdf' : 'image',
                                      formData.idDocumentName.name,
                                      'idDocument'
                                    );
                                  };
                                  reader.readAsDataURL(formData.idDocumentName);
                                } else if (existingFiles.idDocument) {
                                  openPreview(
                                    createViewUrl(existingFiles.idDocument),
                                    existingFiles.idDocument.endsWith('.pdf') ? 'pdf' : 'image',
                                    extractFilename(existingFiles.idDocument),
                                    'idDocument'
                                  );
                                }
                              }}
                              title="Preview"
                              style={{
                                fontSize: '12px',
                                color: '#0d6efd',
                                width: '20px',
                                height: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <i className="icofont-eye"></i>
                            </button>
                            <button
                              type="button"
                              className="btn btn-link p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFormData(prev => ({
                                  ...prev,
                                  idDocumentName: null,
                                }));
                                setExistingFiles(prev => ({
                                  ...prev,
                                  idDocument: null,
                                }));
                                document.getElementById('idDocumentName').value = '';
                                setErrors(prev => ({ ...prev, idDocumentName: '' }));
                              }}
                              title="Remove"
                              style={{
                                fontSize: '12px',
                                color: '#dc3545',
                                width: '20px',
                                height: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <i className="icofont-close"></i>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Total Experience (Years)</label>
                    <input
                      type="number"
                      className="form-control"
                      id="yearOfExperience"
                      value={formData.yearOfExperience}
                      placeholder="Enter total experience in years"
                      min="0"
                      max="60"
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Designation *</label>
                    <select
                      className={`form-select ${hasError('designationId')}`}
                      style={{ paddingRight: "40px" }}
                      value={formData.designationId || ""}
                      onChange={(e) => handleDesignationChange(parseInt(e.target.value, 10))}
                      disabled={loading || !formData.employeeTypeId}
                    >
                      <option value="">Select Designation</option>
                      {designationData.map((designation) => (
                        <option key={designation.designationId} value={designation.designationId}>
                          {designation.designationName}
                        </option>
                      ))}
                    </select>
                    {getErrorMessage('designationId') && (
                      <div className="invalid-feedback">{getErrorMessage('designationId')}</div>
                    )}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Role Name *</label>
                    <select
                      className={`form-select ${hasError('roleId')}`}
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
                    {getErrorMessage('roleId') && (
                      <div className="invalid-feedback">{getErrorMessage('roleId')}</div>
                    )}
                  </div>

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
                  <div className="col-md-4">
                    <label className="form-label">Type of Employee *</label>
                    <select
                      className={`form-select ${hasError('employeeTypeId')}`}
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
                    {getErrorMessage('employeeTypeId') && (
                      <div className="invalid-feedback">{getErrorMessage('employeeTypeId')}</div>
                    )}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Type of Employment *</label>
                    <select
                      className={`form-select ${hasError('employmentTypeId')}`}
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
                    {getErrorMessage('employmentTypeId') && (
                      <div className="invalid-feedback">{getErrorMessage('employmentTypeId')}</div>
                    )}
                  </div>
                </div>
                <div className="col-md-12 mt-3">
                  <label className="form-label">Profile Description</label>
                  <div className="form-group col-md-12">
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
                            profileInclusionRef.current.innerHTML = '';
                            profileInclusionRef.current.appendChild(editor.ui.view.toolbar.element);
                          }
                        }}
                        onChange={handleProfileEditorChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
              {/* Profile Image */}
              <div className="col-md-3 d-flex flex-column">
                <label className="form-label">Profile Image *</label>
                <div className="d-flex flex-column align-items-center border p-2">
                  <div
                    style={{
                      width: '100%',
                      height: '150px',
                      overflow: 'hidden',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: '#f8f9fa',
                      cursor: (formData.profilePicPreview || existingFiles.profilePic) ? 'pointer' : 'default'
                    }}
                    onClick={() => {
                      if (formData.profilePicPreview) {
                        openPreview(
                          formData.profilePicPreview,
                          'image',
                          formData.profilePicName?.name || 'Profile Image',
                          'profile'
                        );
                      } else if (existingFiles.profilePic) {
                        openPreview(
                          createViewUrl(existingFiles.profilePic),
                          'image',
                          extractFilename(existingFiles.profilePic),
                          'profile'
                        );
                      }
                    }}
                  >
                    <img
                      src={formData.profilePicPreview || imageSrc || placeholderImage}
                      alt="Profile"
                      style={{
                        objectFit: "cover",
                        maxWidth: "100%",
                        maxHeight: "100%",
                        borderRadius: '4px'
                      }}
                    />
                  </div>

                  <input
                    type="file"
                    id="profilePicName"
                    className={`form-control mt-2 ${hasError('profilePicName')}`}
                    accept="image/*"
                    onChange={(e) => handleFileWithPreview(e, 'profile')}
                    style={{ fontSize: '12px', padding: '4px 8px' }}
                  />
                  {getErrorMessage('profilePicName') && (
                    <div className="invalid-feedback">{getErrorMessage('profilePicName')}</div>
                  )}

                  {/* File actions */}
                  {(formData.profilePicName || existingFiles.profilePic) && (
                    <div className="d-flex justify-content-between align-items-center w-100 mt-2">
                      <small className="text-muted" style={{ fontSize: '11px' }}>
                        <i className="icofont-check-circled me-1"></i>
                        {formData.profilePicName instanceof File
                          ? formData.profilePicName.name.substring(0, 15)
                          : extractFilename(existingFiles.profilePic).substring(0, 15)}
                        {(formData.profilePicName instanceof File
                          ? formData.profilePicName.name.length > 15
                          : extractFilename(existingFiles.profilePic).length > 15) ? '...' : ''}
                      </small>
                      <div className="d-flex gap-1">
                        <button
                          type="button"
                          className="btn btn-link p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (formData.profilePicPreview) {
                              openPreview(
                                formData.profilePicPreview,
                                'image',
                                formData.profilePicName?.name || 'Profile Image',
                                'profile'
                              );
                            } else if (existingFiles.profilePic) {
                              openPreview(
                                createViewUrl(existingFiles.profilePic),
                                'image',
                                extractFilename(existingFiles.profilePic),
                                'profile'
                              );
                            }
                          }}
                          title="Preview"
                          style={{
                            fontSize: '12px',
                            color: '#0d6efd',
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <i className="icofont-eye"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-link p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormData(prev => ({
                              ...prev,
                              profilePicName: null,
                              profilePicPreview: null,
                            }));
                            setExistingFiles(prev => ({ ...prev, profilePic: null }));
                            document.getElementById('profilePicName').value = '';
                            setErrors(prev => ({ ...prev, profilePicName: '' }));
                          }}
                          title="Remove"
                          style={{
                            fontSize: '12px',
                            color: '#dc3545',
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <i className="icofont-close"></i>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="row mb-3 mt-4">
              <div className="col-sm-12">
                <div className="card shadow mb-3">
                  <div className="card-header   border-bottom-1 py-3">
                    <h6 className="fw-bold mb-0">Educational Qualification *</h6>
                    {errors.qualification && typeof errors.qualification === 'string' && (
                      <small className="text-danger">{errors.qualification}</small>
                    )}
                  </div>
                  <div className="card-body">
                    <table className="table table-bordered">
                      <thead>
                        <tr>
                          <th>S.No</th>
                          <th>Degree *</th>
                          <th>Name of Institution *</th>
                          <th>Year of Completion *</th>
                          <th>File Upload *</th>
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
                                className={`form-control ${errors.qualification?.[index]?.qualificationName ? 'is-invalid' : ''}`}
                                value={row.qualificationName}
                                onChange={(e) => handleQualificationChange(index, "qualificationName", e.target.value)}
                              />
                              {errors.qualification?.[index]?.qualificationName && (
                                <div className="invalid-feedback">
                                  {errors.qualification[index].qualificationName}
                                </div>
                              )}
                            </td>
                            <td>
                              <input
                                type="text"
                                className={`form-control ${errors.qualification?.[index]?.institutionName ? 'is-invalid' : ''}`}
                                value={row.institutionName}
                                onChange={(e) => handleQualificationChange(index, "institutionName", e.target.value)}
                              />
                              {errors.qualification?.[index]?.institutionName && (
                                <div className="invalid-feedback">
                                  {errors.qualification[index].institutionName}
                                </div>
                              )}
                            </td>
                            <td>
                              <input
                                type="text"
                                className={`form-control ${errors.qualification?.[index]?.completionYear ? 'is-invalid' : ''}`}
                                placeholder="YYYY"
                                value={row.completionYear}
                                onChange={(e) => handleQualificationChange(index, "completionYear", e.target.value)}
                              />
                              {errors.qualification?.[index]?.completionYear && (
                                <div className="invalid-feedback">
                                  {errors.qualification[index].completionYear}
                                </div>
                              )}
                            </td>
                            <td>
                              <div className="position-relative">
                                <input
                                  type="file"
                                  className={`form-control ${errors.qualification?.[index]?.filePath ? 'is-invalid' : ''}`}
                                  onChange={(e) => handleFileWithPreview(e, 'qualification', index)}
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  style={{ fontSize: '12px', padding: '4px 8px' }}
                                />
                                {errors.qualification?.[index]?.filePath && (
                                  <div className="invalid-feedback">
                                    {errors.qualification[index].filePath}
                                  </div>
                                )}

                                {/* File actions */}
                                {(row.filePath || existingFiles.qualifications[index]) && (
                                  <div className="d-flex justify-content-between align-items-center mt-1">
                                    <small className="text-muted" style={{ fontSize: '10px' }}>
                                      <i className="icofont-check-circled me-1"></i>
                                      {row.filePath instanceof File
                                        ? row.filePath.name.substring(0, 12)
                                        : extractFilename(existingFiles.qualifications[index]).substring(0, 12)}
                                      {(row.filePath instanceof File
                                        ? row.filePath.name.length > 12
                                        : extractFilename(existingFiles.qualifications[index]).length > 12) ? '...' : ''}
                                    </small>
                                    <div className="d-flex gap-1">
                                      <button
                                        type="button"
                                        className="btn btn-link p-0"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (row.filePath instanceof File) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                              openPreview(
                                                reader.result,
                                                row.filePath.type === 'application/pdf' ? 'pdf' : 'image',
                                                row.filePath.name,
                                                'qualification'
                                              );
                                            };
                                            reader.readAsDataURL(row.filePath);
                                          } else if (existingFiles.qualifications[index]) {
                                            openPreview(
                                              createViewUrl(existingFiles.qualifications[index]),
                                              existingFiles.qualifications[index].endsWith('.pdf') ? 'pdf' : 'image',
                                              extractFilename(existingFiles.qualifications[index]),
                                              'qualification'
                                            );
                                          }
                                        }}
                                        title="Preview"
                                        style={{
                                          fontSize: '11px',
                                          color: '#0d6efd',
                                          width: '18px',
                                          height: '18px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center'
                                        }}
                                      >
                                        <i className="icofont-eye"></i>
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-link p-0"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setFormData(prev => ({
                                            ...prev,
                                            qualification: prev.qualification.map((item, i) =>
                                              i === index ? {
                                                ...item,
                                                filePath: null
                                              } : item
                                            )
                                          }));
                                          setExistingFiles(prev => {
                                            const newQualifications = [...prev.qualifications];
                                            newQualifications[index] = null;
                                            return { ...prev, qualifications: newQualifications };
                                          });
                                          setErrors(prev => {
                                            const newErrors = { ...prev };
                                            if (newErrors.qualification && newErrors.qualification[index]) {
                                              delete newErrors.qualification[index].filePath;
                                            }
                                            return newErrors;
                                          });
                                        }}
                                        title="Remove"
                                        style={{
                                          fontSize: '11px',
                                          color: '#dc3545',
                                          width: '18px',
                                          height: '18px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center'
                                        }}
                                      >
                                        <i className="icofont-close"></i>
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn btn-danger"
                                onClick={() => removeEducationRow(index)}
                              >
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

            {/* Specialty Center Name Section */}
            <div className="row mb-3 mt-4">
              <div className="col-sm-12">
                <div className="card shadow mb-3">
                  <div className="card-header border-bottom-1 py-3">
                    <h6 className="fw-bold mb-0">Specialty Center Name</h6>
                    {errors.specialtyCenter && typeof errors.specialtyCenter === 'string' && (
                      <small className="text-danger">{errors.specialtyCenter}</small>
                    )}
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
                                  placeholder="Search specialty center..."
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    handleSpecialtyCenterChange(index, "specialtyCenterName", value);
                                    handleSpecialtyCenterChange(index, "searchTerm", value);
                                  }}
                                  onBlur={() => {
                                    // Clear search after a short delay when input loses focus
                                    setTimeout(() => {
                                      handleSpecialtyCenterChange(index, "searchTerm", "");
                                    }, 200);
                                  }}
                                  maxLength={mlenght}
                                  autoComplete="off"
                                />

                                {/* Show dropdown only for this row if it has search term */}
                                {row.searchTerm && row.searchTerm.length > 0 && (
                                  <div
                                    className="dropdown-menu show w-100"
                                    style={{
                                      position: 'absolute',
                                      top: '100%',
                                      left: 0,
                                      zIndex: 1000,
                                      maxHeight: '200px',
                                      overflowY: 'auto'
                                    }}
                                  >
                                    {specialtyCenterData
                                      .filter(center => {
                                        const searchLower = row.searchTerm.toLowerCase();
                                        const centerName = center.centerName || "";
                                        const specialtyName = center.specialtyCenterName || "";
                                        return (
                                          centerName.toLowerCase().includes(searchLower) ||
                                          specialtyName.toLowerCase().includes(searchLower)
                                        );
                                      })
                                      .slice(0, 10) // Limit to 10 results for better UX
                                      .map(center => (
                                        <button
                                          key={center.centerId}
                                          type="button"
                                          className="dropdown-item"
                                          onClick={() => {
                                            handleSpecialtyCenterChange(index, "specialtyCenterName", center.centerName || center.specialtyCenterName || "");
                                            handleSpecialtyCenterChange(index, "centerId", center.centerId || "");
                                            handleSpecialtyCenterChange(index, "searchTerm", ""); // Clear search after selection
                                          }}
                                          style={{ cursor: 'pointer' }}
                                        >
                                          {center.centerName || center.specialtyCenterName || ""}
                                        </button>
                                      ))}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn btn-danger"
                                onClick={() => removeSpecialtyCenterRow(index)}
                              >
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

            {/* Work Experience Section */}
            <div className="row mb-3">
              <div className="col-sm-12">
                <div className="card shadow mb-3">
                  <div className="card-header border-bottom-1 py-3">
                    <h6 className="fw-bold mb-0">Work Experience</h6>
                    {errors.workExperiences && typeof errors.workExperiences === 'string' && (
                      <small className="text-danger">{errors.workExperiences}</small>
                    )}
                  </div>
                  <div className="card-body">
                    <table className="table table-bordered">
                      <thead>
                        <tr>
                          <th>S.No</th>
                          <th>Work Experience</th>
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
                                className="form-control"
                                value={row.experienceSummary}
                                placeholder="Enter experience details"
                                onChange={(e) => handleWorkExperienceChange(index, "experienceSummary", e.target.value)}
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

            {/* Memberships Section */}
            <div className="row mb-3">
              <div className="col-sm-12">
                <div className="card shadow mb-3">
                  <div className="card-header border-bottom-1 py-3">
                    <h6 className="fw-bold mb-0">Memberships</h6>
                    {errors.memberships && typeof errors.memberships === 'string' && (
                      <small className="text-danger">{errors.memberships}</small>
                    )}
                  </div>
                  <div className="card-body">
                    <table className="table table-bordered">
                      <thead>
                        <tr>
                          <th>S.No</th>
                          <th>Membership Details</th>
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
                                value={row.membershipSummary}
                                placeholder="Enter membership details"
                                onChange={(e) => handlemembershipsChange(index, "membershipSummary", e.target.value)}
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

            {/* Specialty Interest Section */}
            <div className="row mb-3">
              <div className="col-sm-12">
                <div className="card shadow mb-3">
                  <div className="card-header border-bottom-1 py-3">
                    <h6 className="fw-bold mb-0">Specialty Interest</h6>
                    {errors.specialtyInterest && typeof errors.specialtyInterest === 'string' && (
                      <small className="text-danger">{errors.specialtyInterest}</small>
                    )}
                  </div>
                  <div className="card-body">
                    <table className="table table-bordered">
                      <thead>
                        <tr>
                          <th>S.No</th>
                          <th>Specialty Interest Details</th>
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
                                value={row.interestSummary}
                                placeholder="Enter specialty details"
                                onChange={(e) => handleSpecialtyInterestChange(index, "interestSummary", e.target.value)}
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

            {/* Awards & Distinctions Section */}
            <div className="row mb-3">
              <div className="col-sm-12">
                <div className="card shadow mb-3">
                  <div className="card-header border-bottom-1 py-3">
                    <h6 className="fw-bold mb-0">Awards & Distinctions</h6>
                    {errors.awardsDistinction && typeof errors.awardsDistinction === 'string' && (
                      <small className="text-danger">{errors.awardsDistinction}</small>)}
                  </div>
                  <div className="card-body">
                    <table className="table table-bordered">
                      <thead>
                        <tr>
                          <th>S.No</th>
                          <th>Award Details</th>
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
                                placeholder="Enter award details"
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

            <div className="row mb-3">
              <div className="col-sm-12">
                <div className="card shadow mb-3">
                  <div className="card-header   border-bottom-1 py-3">
                    <h6 className="fw-bold mb-0">Required Documents *</h6>
                    {errors.document && (
                      <small className="text-danger">Please fill all document fields</small>
                    )}
                  </div>
                  <div className="card-body">
                    <table className="table table-bordered">
                      <thead>
                        <tr>
                          <th>S.No</th>
                          <th>Document Name *</th>
                          <th>File Upload *</th>
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
                                placeholder="Enter document name"
                                onChange={(e) => handleDocumentChange(index, "documentName", e.target.value)}
                              />
                            </td>
                            <td>
                              <div className="position-relative">
                                <input
                                  type="file"
                                  className={`form-control ${errors.document?.[index]?.filePath ? 'is-invalid' : ''}`}
                                  onChange={(e) => handleFileWithPreview(e, 'document', index)}
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  style={{ fontSize: '12px', padding: '4px 8px' }}
                                />
                                {errors.document?.[index]?.filePath && (
                                  <div className="invalid-feedback">
                                    {errors.document[index].filePath}
                                  </div>
                                )}

                                {/* File actions */}
                                {(row.filePath || existingFiles.documents[index]) && (
                                  <div className="d-flex justify-content-between align-items-center mt-1">
                                    <small className="text-muted" style={{ fontSize: '10px' }}>
                                      <i className="icofont-check-circled me-1"></i>
                                      {row.filePath instanceof File
                                        ? row.filePath.name.substring(0, 12)
                                        : extractFilename(existingFiles.documents[index]).substring(0, 12)}
                                      {(row.filePath instanceof File
                                        ? row.filePath.name.length > 12
                                        : extractFilename(existingFiles.documents[index]).length > 12) ? '...' : ''}
                                    </small>
                                    <div className="d-flex gap-1">
                                      <button
                                        type="button"
                                        className="btn btn-link p-0"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (row.filePath instanceof File) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                              openPreview(
                                                reader.result,
                                                row.filePath.type === 'application/pdf' ? 'pdf' : 'image',
                                                row.filePath.name,
                                                'document'
                                              );
                                            };
                                            reader.readAsDataURL(row.filePath);
                                          } else if (existingFiles.documents[index]) {
                                            openPreview(
                                              createViewUrl(existingFiles.documents[index]),
                                              existingFiles.documents[index].endsWith('.pdf') ? 'pdf' : 'image',
                                              extractFilename(existingFiles.documents[index]),
                                              'document'
                                            );
                                          }
                                        }}
                                        title="Preview"
                                        style={{
                                          fontSize: '11px',
                                          color: '#0d6efd',
                                          width: '18px',
                                          height: '18px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center'
                                        }}
                                      >
                                        <i className="icofont-eye"></i>
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-link p-0"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setFormData(prev => ({
                                            ...prev,
                                            document: prev.document.map((item, i) =>
                                              i === index ? {
                                                ...item,
                                                filePath: null
                                              } : item
                                            )
                                          }));
                                          // Clear existing file reference
                                          setExistingFiles(prev => {
                                            const newDocuments = [...prev.documents];
                                            newDocuments[index] = null;
                                            return { ...prev, documents: newDocuments };
                                          });
                                          // Clear validation error
                                          setErrors(prev => {
                                            const newErrors = { ...prev };
                                            if (newErrors.document && newErrors.document[index]) {
                                              delete newErrors.document[index].filePath;
                                            }
                                            return newErrors;
                                          });
                                        }}
                                        title="Remove"
                                        style={{
                                          fontSize: '11px',
                                          color: '#dc3545',
                                          width: '18px',
                                          height: '18px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center'
                                        }}
                                      >
                                        <i className="icofont-close"></i>
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
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

            <div className="form-group col-md-12 d-flex justify-content-end mt-2">
              <button
                type="submit" className="btn btn-primary me-2">
                {editingEmployee ? "Update" : "Save"}
              </button>
              <button type="button" className="btn btn-danger" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
      {showDocModal && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          role="dialog"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 100000,
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            overflow: "auto"
          }}
        >

          <div className="modal-dialog modal-xl" role="document" style={{ zIndex: 100000 }}>
            <div className="modal-content" style={{ backgroundColor: "#20c997", color: "white" }}>
              <div className="modal-header" >
                <h5 className="modal-title"  >Document Viewer</h5>
                <button type="button" className="close" onClick={() => setShowDocModal(false)}>
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body" style={{ minHeight: '500px' }}>
                {docType === "application/pdf" ? (
                  <iframe src={docUrl} width="100%" height="500px" title="PDF Viewer" />
                ) : (
                  <img src={docUrl} alt="Document" className="img-fluid" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewModal.show && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          zIndex: 999999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            width: '90%',
            height: '90%',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '15px 20px',
              borderBottom: '1px solid #dee2e6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h6 style={{ margin: 0 }}>
                <i className="icofont-file-alt me-2"></i>
                {previewModal.fileName}
              </h6>
              <div>
                <button
                  onClick={closePreview}
                  className="btn btn-sm btn-danger"
                  style={{ fontSize: '12px' }}
                >
                  <i className="icofont-close me-1"></i> Close
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{
              flex: 1,
              padding: '20px',
              overflow: 'auto',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              {previewModal.type === 'image' ? (
                <img
                  src={previewModal.url}
                  alt={previewModal.fileName}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain'
                  }}
                />
              ) : previewModal.type === 'pdf' ? (
                <iframe
                  src={previewModal.url}
                  title={previewModal.fileName}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none'
                  }}
                />
              ) : (
                <div style={{
                  textAlign: 'center',
                  color: '#6c757d'
                }}>
                  <i className="icofont-file-alt" style={{ fontSize: '48px' }}></i>
                  <p className="mt-3">File preview not available for this file type</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewSearchEmployee;