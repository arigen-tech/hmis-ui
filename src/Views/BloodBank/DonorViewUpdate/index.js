import { useState, useEffect, useRef } from "react";
import Popup from "../../../Components/popup";
import LoadingScreen from "../../../Components/Loading";
import Pagination, {
  DEFAULT_ITEMS_PER_PAGE,
} from "../../../Components/Pagination";
import {
  ALL_COUNTRY,
  ALL_GENDER,
  ALL_RELATION,
  DISTRICT_BY_STATE,
  DONOR_SEARCH_LIST,
  GET_DONOR_AND_SCREENING_DETAILS,
  MAS_BLOODGROUP,
  STATE_BY_COUNTRY,
  UPDATE_DONOR_AND_SCREENING,
} from "../../../config/apiConfig";
import {
  getRequest,
  postRequest,
  putRequest,
} from "../../../service/apiService";
import {
  DEFERRAL_TYPE_PERMANENT,
  DEFERRAL_TYPE_TEMPORARY,
  SCREENING_RESULT_FAIL,
  SCREENING_RESULT_PASS,
} from "../../../config/constants";

const DonorRegistrationViewUpdate = () => {
  const [currentView, setCurrentView] = useState("list");
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [donorList, setDonorList] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const [genderData, setGenderData] = useState([]);
  const [relationData, setRelationData] = useState([]);
  const [bloodGroupData, setBloodGroupData] = useState([]);
  const [countryData, setCountryData] = useState([]);

  const [stateData, setStateData] = useState([]);
  const [districtData, setDistrictData] = useState([]);
  const [popupMessage, setPopupMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statesCache, setStatesCache] = useState({});
  const [eligibility, setEligibility] = useState({
    eligible: true,
    nextEligibleDate: null,
  });

  const [searchFilters, setSearchFilters] = useState({
    donorName: "",
    mobileNo: "",
  });

  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    mobileNo: "",
    gender: "",
    relation: "",
    dob: "",
    bloodGroup: "",
    address1: "",
    address2: "",
    country: "",
    state: "",
    district: "",
    city: "",
    pinCode: "",
    hemoglobin: "",
    weight: "",
    height: "",
    bloodPressure: "",
    pulse: "",
    temperature: "",
    screenResult: "",
    deferralType: "",
    deferralReason: "",
  });

  const [newScreening, setNewScreening] = useState({
    screeningDate: new Date().toISOString().split("T")[0],
    hemoglobin: "",
    weight: "",
    height: "",
    bloodPressure: "",
    pulse: "",
    temperature: "",
    screenResult: "",
    deferralType: "",
    deferralReason: "",
    conductedBy: "",
  });

  const [errors, setErrors] = useState({});
  const [newScreeningErrors, setNewScreeningErrors] = useState({});

  const showPopup = (message, type = "info") => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
      },
    });
  };

  const hospitalId =
    sessionStorage.getItem("hospitalId") || localStorage.getItem("hospitalId");

  const fetchDonors = async (page = 0, donorName = "", mobileNo = "") => {
    setSearchLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", page);
      params.append("size", DEFAULT_ITEMS_PER_PAGE);
      params.append("hospitalId", hospitalId);

      if (donorName && donorName.trim()) {
        params.append("donorName", donorName.trim());
      }
      if (mobileNo && mobileNo.trim()) {
        params.append("mobileNo", mobileNo.trim());
      }

      const response = await getRequest(
        `${DONOR_SEARCH_LIST}?${params.toString()}`,
      );

      if (response?.response) {
        const pageData = response.response;

        console.log(pageData.content);
        setDonorList(pageData.content || []);
        setTotalPages(Number(pageData.totalPages) || 1);
        setTotalItems(pageData.totalElements || 0);
        setSearchPerformed(true);
      } else {
        setDonorList([]);
        showPopup("No donors found", "info");
      }
    } catch (error) {
      console.error("Error fetching donors:", error);
      showPopup("Failed to fetch donors", "error");
    } finally {
      setSearchLoading(false);
    }
  };

  const fetchGenderData = async () => {
    try {
      const response = await getRequest(`${ALL_GENDER}/1`);
      if (response.status === 200 && Array.isArray(response.response)) {
        setGenderData(response.response);
      } else {
        setGenderData([]);
      }
    } catch (error) {
      console.error("Error fetching gender data:", error);
      setGenderData([]);
    }
  };

  const fetchBloodGroupData = async () => {
    try {
      const response = await getRequest(`${MAS_BLOODGROUP}/getAll/1`);
      if (response.status === 200 && Array.isArray(response.response)) {
        setBloodGroupData(response.response);
      } else {
        setBloodGroupData([]);
      }
    } catch (error) {
      console.error("Error fetching blood group data:", error);
      setBloodGroupData([]);
    }
  };

  const fetchRelationData = async () => {
    try {
      const response = await getRequest(`${ALL_RELATION}/1`);
      if (response.status === 200 && Array.isArray(response.response)) {
        setRelationData(response.response);
      } else {
        setRelationData([]);
      }
    } catch (error) {
      console.error("Error fetching relation data:", error);
      setRelationData([]);
    }
  };

  const fetchCountryData = async () => {
    try {
      const response = await getRequest(`${ALL_COUNTRY}/1`);
      if (response.status === 200 && Array.isArray(response.response)) {
        setCountryData(response.response);
      } else {
        setCountryData([]);
      }
    } catch (error) {
      console.error("Error fetching country data:", error);
      setCountryData([]);
    }
  };

  const fetchStatesByCountry = async (countryId) => {
    if (statesCache[countryId]) {
      setStateData(statesCache[countryId]);
      return;
    }

    try {
      const response = await getRequest(`${STATE_BY_COUNTRY}${countryId}`);
      if (response.status === 200) {
        setStatesCache((prev) => ({ ...prev, [countryId]: response.response }));
        setStateData(response.response);
      }
    } catch (error) {
      console.error("Error fetching states:", error);
    }
  };

  const fetchDistrictsByState = async (stateId) => {
    try {
      const response = await getRequest(`${DISTRICT_BY_STATE}${stateId}`);
      if (response.status === 200) {
        setDistrictData(response.response);
      }
    } catch (error) {
      console.error("Error fetching districts:", error);
    }
  };

  const handleSearch = async (page = 0) => {
    setCurrentPage(page + 1);
    await fetchDonors(page, searchFilters.donorName, searchFilters.mobileNo);
  };

  const loadMasterData = async () => {
    setLoading(true);
    try {
      await Promise.allSettled([
        fetchGenderData(),
        fetchRelationData(),
        fetchBloodGroupData(),
        fetchCountryData(),
      ]);
    } catch (err) {
      console.error("Error loading master data", err);
      showPopup(
        "Some master data could not be loaded. You may need to refresh the page.",
        "warning",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSearchFilters({
      donorName: "",
      mobileNo: "",
    });
    setDonorList([]);
    setSearchPerformed(false);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditClick = async (donor, e) => {
    e.stopPropagation();

    try {
      setLoading(true);
      const response = await getRequest(
        `${GET_DONOR_AND_SCREENING_DETAILS}?donorId=${donor.donorId}&hospitalId=${hospitalId}`,
      );

      if (response.status === 200) {
        const fullDonor = response.response;
        setSelectedRecord(fullDonor);

        setFormData({
          firstName: fullDonor.firstName || "",
          lastName: fullDonor.lastName || "",
          mobileNo: fullDonor.mobileNo || "",

          gender: fullDonor.gender,
          relation: fullDonor.relation,
          bloodGroup: fullDonor.bloodGroupId,

          dob: fullDonor.dateOfBirth ? fullDonor.dateOfBirth.split("T")[0] : "",
          address1: fullDonor.addressLine1 || "",
          address2: fullDonor.addressLine2 || "",

          country: fullDonor.country || "",
          state: fullDonor.state || "",
          district: fullDonor.district || "",

          city: fullDonor.city || "",
          pinCode: fullDonor.pinCode || "",

          hemoglobin:
            fullDonor.bloodDonorPreviousScreenings?.[0]?.hemoglobin || "",
          weight: fullDonor.bloodDonorPreviousScreenings?.[0]?.weight || "",
          height: fullDonor.bloodDonorPreviousScreenings?.[0]?.height || "",
          bloodPressure: fullDonor.bloodDonorPreviousScreenings?.[0]?.bp || "",
          pulse: fullDonor.bloodDonorPreviousScreenings?.[0]?.pulse || "",
          temperature:
            fullDonor.bloodDonorPreviousScreenings?.[0]?.temperature || "",
          screenResult:
            fullDonor.donorScreeningStatus === "p"
              ? "pass"
              : fullDonor.donorScreeningStatus === "f"
                ? "fail"
                : "",
          deferralType:
            fullDonor.bloodDonorPreviousScreenings?.[0]?.deferralType || "",
          deferralReason:
            fullDonor.bloodDonorPreviousScreenings?.[0]?.deferralReason || "",
        });
        setEligibility({
          eligible: fullDonor.eligibleForDonation,
          nextEligibleDate: fullDonor.nextEligibleDonationDate,
        });

        if (fullDonor.country) {
          await fetchStatesByCountry(fullDonor.country);
          if (fullDonor.state) {
            await fetchDistrictsByState(fullDonor.state);
          }
        }

        setCurrentView("detail");
      }
    } catch (error) {
      console.error("Error fetching donor details:", error);
      showPopup("Failed to load donor details", "error");
    } finally {
      setLoading(false);
    }
  };

  const isEligibleForScreening = selectedRecord?.eligibleForDonation ?? true;
  const nextEligibleDate = selectedRecord?.nextEligibleDonationDate;
  const deferralType =
    selectedRecord?.bloodDonorPreviousScreenings[0]?.deferralType;

  const handleBackToList = () => {
    setCurrentView("list");
    setSelectedRecord(null);
    setFormData({
      firstName: "",
      middleName: "",
      lastName: "",
      mobileNo: "",
      gender: "",
      relation: "",
      dob: "",
      bloodGroup: "",
      address1: "",
      address2: "",
      country: "",
      state: "",
      district: "",
      city: "",
      pinCode: "",
      hemoglobin: "",
      weight: "",
      height: "",
      bloodPressure: "",
      pulse: "",
      temperature: "",
      screenResult: "",
      deferralType: "",
      deferralReason: "",
    });
    setNewScreening({
      screeningDate: new Date().toISOString().split("T")[0],
      hemoglobin: "",
      weight: "",
      height: "",
      bloodPressure: "",
      pulse: "",
      temperature: "",
      screenResult: "",
      deferralType: "",
      deferralReason: "",
      conductedBy: "",
    });
    setErrors({});
    setNewScreeningErrors({});
    setStateData([]);
    setDistrictData([]);
  };

  useEffect(() => {
    loadMasterData();
  }, []);

  const handleChange = async (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...formData, [name]: value };

    if (name === "screenResult") {
      if (value === SCREENING_RESULT_PASS) {
        updatedForm.deferralType = "";
        updatedForm.deferralReason = "";
      }
    }

    if (name === "country") {
      if (value) {
        await fetchStatesByCountry(value);
      }
      updatedForm.state = "";
      updatedForm.district = "";
      setDistrictData([]);
    }

    if (name === "state") {
      if (value) {
        await fetchDistrictsByState(value);
      }
      updatedForm.district = "";
    }

    setFormData(updatedForm);
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setNewScreeningErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleNewScreeningChange = (e) => {
    const { name, value } = e.target;
    const updatedScreening = { ...newScreening, [name]: value };

    if (name === "screenResult") {
      if (value === SCREENING_RESULT_PASS) {
        updatedScreening.deferralType = "";
        updatedScreening.deferralReason = "";
      }
    }

    setNewScreening(updatedScreening);
    setNewScreeningErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const getDeferralBadge = (type) => {
    if (type === "p") {
      return <span className="badge bg-danger">Permanent</span>;
    } else if (type === "t") {
      return <span className="badge bg-warning text-dark">Temporary</span>;
    }
    return <span className="badge bg-secondary">—</span>;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim())
      newErrors.firstName = "First Name is required";

    if (!formData.lastName.trim()) newErrors.lastName = "Last Name is required";

    if (!/^\d{10}$/.test(formData.mobileNo))
      newErrors.mobileNo = "Mobile must be 10 digits";

    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.relation) newErrors.relation = "Relation is required";
    if (!formData.dob) newErrors.dob = "DOB is required";
    if (!formData.bloodGroup) newErrors.bloodGroup = "Blood Group is required";

    if (!formData.address1.trim()) newErrors.address1 = "Address is required";

    if (!formData.country) newErrors.country = "Country is required";
    if (!formData.state) newErrors.state = "State is required";
    if (!formData.district) newErrors.district = "District is required";

    if (!formData.city.trim()) newErrors.city = "City is required";

    if (!/^\d{6}$/.test(formData.pinCode))
      newErrors.pinCode = "Pin must be 6 digits";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateNewScreening = () => {
    const newErrors = {};

    if (!newScreening.hemoglobin) newErrors.hemoglobin = "Hemoglobin required";

    if (!newScreening.weight) newErrors.weight = "Weight required";

    if (!newScreening.height) newErrors.height = "Height required";

    if (!/^\d{2,3}\/\d{2,3}$/.test(newScreening.bloodPressure))
      newErrors.bloodPressure = "Format 120/80";

    if (!newScreening.pulse) newErrors.pulse = "Pulse required";

    if (!newScreening.temperature)
      newErrors.temperature = "Temperature required";

    if (!newScreening.screenResult)
      newErrors.screenResult = "Screen Result required";

    if (!newScreening.conductedBy.trim()) newErrors.conductedBy = "Required";

    // 🔴 SAME LOGIC AS FIRST PAGE
    if (newScreening.screenResult === SCREENING_RESULT_FAIL) {
      if (!newScreening.deferralType)
        newErrors.deferralType = "Deferral Type required";

      if (!newScreening.deferralReason.trim())
        newErrors.deferralReason = "Deferral Reason required";
    }

    setNewScreeningErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async () => {
    const isFormValid = validateForm();
    const isScreeningValid = validateNewScreening();

    if (!isFormValid || !isScreeningValid) {
      showPopup("Please fill all mandatory fields", "warning");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        bloodDonorPersonalDetailsRequest: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          genderId: Number(formData.gender),
          dateOfBirth: formData.dob,
          mobileNo: formData.mobileNo,
          bloodGroupId: Number(formData.bloodGroup),
          relationId: Number(formData.relation),
          addressLine1: formData.address1,
          addressLine2: formData.address2,
          countryId: Number(formData.country),
          stateId: Number(formData.state),
          districtId: Number(formData.district),
          city: formData.city,
          pinCode: formData.pinCode,
        },
        bloodDonorScreeningRequest: {
          hemoglobin: Number(newScreening.hemoglobin),
          weightKg: Number(newScreening.weight),
          heightCm: Number(newScreening.height),
          bloodPressure: newScreening.bloodPressure,
          pulseRate: Number(newScreening.pulse),
          temperature: Number(newScreening.temperature),
          screeningResult: newScreening.screenResult,
          deferralType: newScreening.deferralType,
          deferralReason: newScreening.deferralReason || null,
        },
      };

      const response = await putRequest(
        `${UPDATE_DONOR_AND_SCREENING}?donorId=${selectedRecord.donorId}`,
        payload,
      );

      if (response?.status === 200) {
        showPopup("Donor updated successfully!", "success");
        handleBackToList();
        handleSearch(currentPage - 1);
      } else {
        showPopup("Failed to update donor", "error");
      }
    } catch (error) {
      console.error("Update error:", error);
      showPopup("Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };

  let eligibilityMessage = "";

  if (!isEligibleForScreening) {
    if (deferralType === "p") {
      eligibilityMessage =
        "Donor is permanently deferred and not eligible for screening.";
    } else if (nextEligibleDate) {
      eligibilityMessage = `Donor is not eligible until ${nextEligibleDate}.`;
    } else {
      eligibilityMessage = "Donor is not eligible for screening.";
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return dateStr.split("T")[0];
  };

  const getStatusBadge = (screenResult) => {
    if (screenResult === "p") {
      return <span className="badge bg-success">Passed</span>;
    } else if (screenResult === "f") {
      return <span className="badge bg-danger">Failed</span>;
    }
    return <span className="badge bg-secondary">Not Screened</span>;
  };

  const getApprovalStatusBadge = (status) => {
    switch (status) {
      case "a":
        return <span className="badge bg-success">Approved</span>;
      case "s":
        return <span className="badge bg-info">Saved</span>;
      case "p":
        return <span className="badge bg-warning text-dark">Pending</span>;
      case "r":
        return <span className="badge bg-danger">Rejected</span>;
      default:
        return <span className="badge bg-secondary">Unknown</span>;
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (currentView === "detail") {
    const allScreenings = selectedRecord?.bloodDonorPreviousScreenings || [];

    return (
      <div className="content-wrapper">
        {popupMessage && (
          <Popup
            message={popupMessage.message}
            type={popupMessage.type}
            onClose={popupMessage.onClose}
          />
        )}

        <div className="row">
          <div className="col-12 grid-margin stretch-card">
            <div className="card form-card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h4 className="card-title p-2 mb-0">
                  View And Edit Donor Registration
                </h4>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleBackToList}
                >
                  Back to List
                </button>
              </div>

              <div className="card-body">
                {/* Donor Basic Info Header */}
                <div className="row mb-4">
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Donor ID</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.donorCode || "N/A"}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">
                      Registration Date
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={formatDate(selectedRecord?.createdDate) || "N/A"}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">
                      Screening Result
                    </label>
                    <div className="form-control">
                      {getStatusBadge(selectedRecord?.donorScreeningStatus)}
                    </div>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Registered By</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedRecord?.createdBy || "N/A"}
                      readOnly
                    />
                  </div>
                  <div className="col-md-3 mt-3">
                    <label className="form-label fw-bold">Status</label>
                    <div className="form-control">
                      {getApprovalStatusBadge(selectedRecord?.status)}
                    </div>
                  </div>
                </div>

                {/* Personal Details Card */}
                <div className="card shadow mb-3">
                  <div className="card-header py-3 border-bottom-1">
                    <h6 className="mb-0 fw-bold">Personal Details</h6>
                  </div>
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="form-label">
                          First Name <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className={`form-control ${errors.firstName ? "is-invalid" : ""}`}
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          placeholder="Enter First Name"
                          readOnly={
                            selectedRecord?.status === "a" ||
                            selectedRecord?.status === "p"
                          }
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
                          name="middleName"
                          value={formData.middleName}
                          onChange={handleChange}
                          className="form-control"
                          placeholder="Enter Middle Name"
                          readOnly={
                            selectedRecord?.status === "a" ||
                            selectedRecord?.status === "p"
                          }
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">
                          Last Name <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          className={`form-control ${errors.lastName ? "is-invalid" : ""}`}
                          placeholder="Enter Last Name"
                          readOnly={
                            selectedRecord?.status === "a" ||
                            selectedRecord?.status === "p"
                          }
                        />
                        {errors.lastName && (
                          <div className="invalid-feedback">
                            {errors.lastName}
                          </div>
                        )}
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">
                          Mobile No. <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className={`form-control ${errors.mobileNo ? "is-invalid" : ""}`}
                          name="mobileNo"
                          value={formData.mobileNo}
                          maxLength={10}
                          onChange={handleChange}
                          placeholder="Enter Mobile Number"
                          readOnly={
                            selectedRecord?.status === "a" ||
                            selectedRecord?.status === "p"
                          }
                        />
                        {errors.mobileNo && (
                          <div className="invalid-feedback">
                            {errors.mobileNo}
                          </div>
                        )}
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">
                          Gender <span className="text-danger">*</span>
                        </label>
                        <select
                          className={`form-select ${errors.gender ? "is-invalid" : ""}`}
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                          disabled={
                            selectedRecord?.status === "a" ||
                            selectedRecord?.status === "p"
                          }
                        >
                          <option value="">Select Gender</option>
                          {genderData.map((gender) => (
                            <option key={gender.id} value={gender.id}>
                              {gender.genderName}
                            </option>
                          ))}
                        </select>
                        {errors.gender && (
                          <div className="invalid-feedback">
                            {errors.gender}
                          </div>
                        )}
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">
                          Relation <span className="text-danger">*</span>
                        </label>
                        <select
                          className={`form-select ${errors.relation ? "is-invalid" : ""}`}
                          name="relation"
                          value={formData.relation}
                          onChange={handleChange}
                          disabled={
                            selectedRecord?.status === "a" ||
                            selectedRecord?.status === "p"
                          }
                        >
                          <option value="">Select Relation</option>
                          {relationData.map((relation) => (
                            <option key={relation.id} value={relation.id}>
                              {relation.relationName}
                            </option>
                          ))}
                        </select>
                        {errors.relation && (
                          <div className="invalid-feedback">
                            {errors.relation}
                          </div>
                        )}
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">
                          Date of Birth <span className="text-danger">*</span>
                        </label>
                        <input
                          type="date"
                          name="dob"
                          className={`form-control ${errors.dob ? "is-invalid" : ""}`}
                          value={formData.dob}
                          max={new Date().toISOString().split("T")[0]}
                          onChange={handleChange}
                          readOnly={
                            selectedRecord?.status === "a" ||
                            selectedRecord?.status === "p"
                          }
                        />
                        {errors.dob && (
                          <div className="invalid-feedback">{errors.dob}</div>
                        )}
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">
                          Blood Group <span className="text-danger">*</span>
                        </label>
                        <select
                          className={`form-select ${errors.bloodGroup ? "is-invalid" : ""}`}
                          name="bloodGroup"
                          value={formData.bloodGroup}
                          onChange={handleChange}
                          disabled={
                            selectedRecord?.status === "a" ||
                            selectedRecord?.status === "p"
                          }
                        >
                          <option value="">Select Blood Group</option>
                          {bloodGroupData.map((bloodGroup) => (
                            <option
                              key={bloodGroup.id}
                              value={bloodGroup.bloodGroupId}
                            >
                              {bloodGroup.bloodGroupName}
                            </option>
                          ))}
                        </select>
                        {errors.bloodGroup && (
                          <div className="invalid-feedback">
                            {errors.bloodGroup}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address Details Card */}
                <div className="card shadow mb-3">
                  <div className="card-header py-3 border-bottom-1">
                    <h6 className="mb-0 fw-bold">Address Details</h6>
                  </div>
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">
                          Address 1 <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className={`form-control ${errors.address1 ? "is-invalid" : ""}`}
                          name="address1"
                          value={formData.address1}
                          onChange={handleChange}
                          placeholder="Enter Address 1"
                          readOnly={
                            selectedRecord?.status === "a" ||
                            selectedRecord?.status === "p"
                          }
                        />
                        {errors.address1 && (
                          <div className="invalid-feedback">
                            {errors.address1}
                          </div>
                        )}
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Address 2</label>
                        <input
                          type="text"
                          className="form-control"
                          name="address2"
                          value={formData.address2}
                          onChange={handleChange}
                          placeholder="Enter Address 2"
                          readOnly={
                            selectedRecord?.status === "a" ||
                            selectedRecord?.status === "p"
                          }
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">
                          Country <span className="text-danger">*</span>
                        </label>
                        <select
                          className={`form-select ${errors.country ? "is-invalid" : ""}`}
                          name="country"
                          value={formData.country}
                          onChange={handleChange}
                          disabled={
                            selectedRecord?.status === "a" ||
                            selectedRecord?.status === "p"
                          }
                        >
                          <option value="">Select Country</option>
                          {countryData.map((country) => (
                            <option key={country.id} value={country.id}>
                              {country.countryName}
                            </option>
                          ))}
                        </select>
                        {errors.country && (
                          <div className="invalid-feedback">
                            {errors.country}
                          </div>
                        )}
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">
                          State <span className="text-danger">*</span>
                        </label>
                        <select
                          className={`form-select ${errors.state ? "is-invalid" : ""}`}
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          disabled={
                            !formData.country ||
                            selectedRecord?.status === "a" ||
                            selectedRecord?.status === "p"
                          }
                        >
                          <option value="">Select State</option>
                          {stateData.map((state) => (
                            <option key={state.id} value={state.id}>
                              {state.stateName}
                            </option>
                          ))}
                        </select>
                        {errors.state && (
                          <div className="invalid-feedback">{errors.state}</div>
                        )}
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">
                          District <span className="text-danger">*</span>
                        </label>
                        <select
                          className={`form-select ${errors.district ? "is-invalid" : ""}`}
                          name="district"
                          value={formData.district}
                          onChange={handleChange}
                          disabled={
                            !formData.state ||
                            selectedRecord?.status === "a" ||
                            selectedRecord?.status === "p"
                          }
                        >
                          <option value="">Select District</option>
                          {districtData.map((district) => (
                            <option key={district.id} value={district.id}>
                              {district.districtName}
                            </option>
                          ))}
                        </select>
                        {errors.district && (
                          <div className="invalid-feedback">
                            {errors.district}
                          </div>
                        )}
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">
                          City <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className={`form-control ${errors.city ? "is-invalid" : ""}`}
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          placeholder="Enter City"
                          readOnly={
                            selectedRecord?.status === "a" ||
                            selectedRecord?.status === "p"
                          }
                        />
                        {errors.city && (
                          <div className="invalid-feedback">{errors.city}</div>
                        )}
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">
                          Pin Code <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className={`form-control ${errors.pinCode ? "is-invalid" : ""}`}
                          name="pinCode"
                          value={formData.pinCode}
                          maxLength={6}
                          onChange={handleChange}
                          placeholder="Enter Pin Code"
                          readOnly={
                            selectedRecord?.status === "a" ||
                            selectedRecord?.status === "p"
                          }
                        />
                        {errors.pinCode && (
                          <div className="invalid-feedback">
                            {errors.pinCode}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Previous Screenings Table */}
                <div className="card shadow mb-3">
                  <div className="card-header py-3 border-bottom-1">
                    <h6 className="mb-0 fw-bold">Previous Screenings</h6>
                  </div>
                  <div className="card-body">
                    {allScreenings.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-bordered table-hover">
                          <thead>
                            <tr>
                              <th>Screening Date</th>
                              <th>Hb (g/dL)</th>
                              <th>Weight (kg)</th>
                              <th>Height (cm)</th>
                              <th>BP</th>
                              <th>Pulse</th>
                              <th>Temp (°C)</th>
                              <th>Result</th>
                              <th>Deferral Type</th>
                              <th>Deferral Reason</th>
                              <th>Conducted By</th>
                            </tr>
                          </thead>
                          <tbody>
                            {allScreenings.map((screening, index) => (
                              <tr key={screening.id || index}>
                                <td>{screening.screeningDate}</td>
                                <td>{screening.hemoglobin}</td>
                                <td>{screening.weight}</td>
                                <td>{screening.height}</td>
                                <td>{screening.bp}</td>
                                <td>{screening.pulse}</td>
                                <td>{screening.temperature}</td>
                                <td>
                                  {getStatusBadge(screening.screeningResult)}
                                </td>
                                <td>
                                  {getDeferralBadge(screening.deferralType)}
                                </td>
                                <td>{screening.deferralReason || "—"}</td>
                                <td>{screening.conductedBy}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-muted text-center py-3">
                        No previous screenings found
                      </div>
                    )}
                  </div>
                </div>

                {!isEligibleForScreening && (
                  <div className="alert alert-danger mb-3">
                    <i className="fa fa-ban me-2"></i>
                    {eligibilityMessage}
                  </div>
                )}

                {/* Add New Screening Section */}
                {isEligibleForScreening && (
                  <div className="card shadow mb-3">
                    <div className="card shadow mb-3">
                      <div className="card-header py-3 border-bottom-1">
                        <h6 className="mb-0 fw-bold">Add New Screening</h6>
                      </div>
                      <div className="card-body">
                        <div className="row g-3">
                          <div className="col-md-3">
                            <label className="form-label">
                              Screening Date{" "}
                              <span className="text-danger">*</span>
                            </label>
                            <input
                              type="date"
                              name="screeningDate"
                              className={`form-control ${newScreeningErrors.screeningDate ? "is-invalid" : ""}`}
                              value={newScreening.screeningDate}
                              onChange={handleNewScreeningChange}
                              max={new Date().toISOString().split("T")[0]}
                              readOnly
                              disabled
                            />
                            {newScreeningErrors.screeningDate && (
                              <div className="invalid-feedback">
                                {newScreeningErrors.screeningDate}
                              </div>
                            )}
                          </div>
                          <div className="col-md-3">
                            <label className="form-label">
                              Hemoglobin (g/dL){" "}
                              <span className="text-danger">*</span>
                            </label>
                            <input
                              type="number"
                              name="hemoglobin"
                              className={`form-control ${newScreeningErrors.hemoglobin ? "is-invalid" : ""}`}
                              value={newScreening.hemoglobin}
                              onChange={handleNewScreeningChange}
                              placeholder="Enter Hemoglobin"
                              step="0.1"
                              disabled={
                                selectedRecord?.status === "a" ||
                                selectedRecord?.status === "p"
                              }
                            />
                            {newScreeningErrors.hemoglobin && (
                              <div className="invalid-feedback">
                                {newScreeningErrors.hemoglobin}
                              </div>
                            )}
                          </div>
                          <div className="col-md-3">
                            <label className="form-label">
                              Weight (kg) <span className="text-danger">*</span>
                            </label>
                            <input
                              type="number"
                              name="weight"
                              className={`form-control ${newScreeningErrors.weight ? "is-invalid" : ""}`}
                              value={newScreening.weight}
                              onChange={handleNewScreeningChange}
                              placeholder="Enter Weight"
                              step="0.1"
                              disabled={
                                selectedRecord?.status === "a" ||
                                selectedRecord?.status === "p"
                              }
                            />
                            {newScreeningErrors.weight && (
                              <div className="invalid-feedback">
                                {newScreeningErrors.weight}
                              </div>
                            )}
                          </div>
                          <div className="col-md-3">
                            <label className="form-label">
                              Height (cm) <span className="text-danger">*</span>
                            </label>
                            <input
                              type="number"
                              name="height"
                              className={`form-control ${newScreeningErrors.height ? "is-invalid" : ""}`}
                              value={newScreening.height}
                              onChange={handleNewScreeningChange}
                              placeholder="Enter Height"
                              step="0.1"
                              disabled={
                                selectedRecord?.status === "a" ||
                                selectedRecord?.status === "p"
                              }
                            />
                            {newScreeningErrors.height && (
                              <div className="invalid-feedback">
                                {newScreeningErrors.height}
                              </div>
                            )}
                          </div>
                          <div className="col-md-3">
                            <label className="form-label">
                              Blood Pressure{" "}
                              <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              name="bloodPressure"
                              className={`form-control ${newScreeningErrors.bloodPressure ? "is-invalid" : ""}`}
                              value={newScreening.bloodPressure}
                              onChange={handleNewScreeningChange}
                              placeholder="120/80"
                              disabled={
                                selectedRecord?.status === "a" ||
                                selectedRecord?.status === "p"
                              }
                            />
                            {newScreeningErrors.bloodPressure && (
                              <div className="invalid-feedback">
                                {newScreeningErrors.bloodPressure}
                              </div>
                            )}
                          </div>
                          <div className="col-md-3">
                            <label className="form-label">
                              Pulse Rate (bpm){" "}
                              <span className="text-danger">*</span>
                            </label>
                            <input
                              type="number"
                              name="pulse"
                              className={`form-control ${newScreeningErrors.pulse ? "is-invalid" : ""}`}
                              value={newScreening.pulse}
                              onChange={handleNewScreeningChange}
                              placeholder="Enter Pulse Rate"
                              disabled={
                                selectedRecord?.status === "a" ||
                                selectedRecord?.status === "p"
                              }
                            />
                            {newScreeningErrors.pulse && (
                              <div className="invalid-feedback">
                                {newScreeningErrors.pulse}
                              </div>
                            )}
                          </div>
                          <div className="col-md-3">
                            <label className="form-label">
                              Temperature (°C){" "}
                              <span className="text-danger">*</span>
                            </label>
                            <input
                              type="number"
                              name="temperature"
                              className={`form-control ${newScreeningErrors.temperature ? "is-invalid" : ""}`}
                              value={newScreening.temperature}
                              onChange={handleNewScreeningChange}
                              placeholder="Enter Temperature"
                              step="0.1"
                              disabled={
                                selectedRecord?.status === "a" ||
                                selectedRecord?.status === "p"
                              }
                            />
                            {newScreeningErrors.temperature && (
                              <div className="invalid-feedback">
                                {newScreeningErrors.temperature}
                              </div>
                            )}
                          </div>
                          <div className="col-md-3">
                            <label className="form-label">
                              Conducted By{" "}
                              <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              name="conductedBy"
                              className={`form-control ${newScreeningErrors.conductedBy ? "is-invalid" : ""}`}
                              value={newScreening.conductedBy}
                              onChange={handleNewScreeningChange}
                              placeholder="Enter name"
                              disabled={
                                selectedRecord?.status === "a" ||
                                selectedRecord?.status === "p"
                              }
                            />
                            {newScreeningErrors.conductedBy && (
                              <div className="invalid-feedback">
                                {newScreeningErrors.conductedBy}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="row g-3 mt-2">
                          <div className="col-md-4">
                            <label className="form-label">
                              Screen Result{" "}
                              <span className="text-danger">*</span>
                            </label>
                            <div>
                              <div className="form-check form-check-inline">
                                <input
                                  className="form-check-input"
                                  type="radio"
                                  name="screenResult"
                                  id="screenPass"
                                  value={SCREENING_RESULT_PASS}
                                  checked={
                                    newScreening.screenResult ===
                                    SCREENING_RESULT_PASS
                                  }
                                  onChange={handleNewScreeningChange}
                                />
                                <label
                                  className="form-check-label"
                                  htmlFor="newScreenPass"
                                >
                                  Pass
                                </label>
                              </div>
                              <div className="form-check form-check-inline">
                                <input
                                  className="form-check-input"
                                  type="radio"
                                  name="screenResult"
                                  id="newScreenFail"
                                  value={SCREENING_RESULT_FAIL}
                                  checked={
                                    newScreening.screenResult ===
                                    SCREENING_RESULT_FAIL
                                  }
                                  onChange={handleNewScreeningChange}
                                />
                                <label
                                  className="form-check-label"
                                  htmlFor="newScreenFail"
                                >
                                  Fail
                                </label>
                              </div>
                            </div>
                            {newScreeningErrors.screenResult && (
                              <div className="text-danger small mt-1">
                                {newScreeningErrors.screenResult}
                              </div>
                            )}
                          </div>

                          <div className="col-md-4">
                            <label className="form-label">Deferral Type</label>
                            <div>
                              <div className="form-check form-check-inline">
                                <input
                                  className="form-check-input"
                                  type="radio"
                                  name="deferralType"
                                  id="deferralTemporary"
                                  value={DEFERRAL_TYPE_TEMPORARY}
                                  checked={
                                    newScreening.deferralType ===
                                    DEFERRAL_TYPE_TEMPORARY
                                  }
                                  onChange={handleNewScreeningChange}
                                  disabled={
                                    newScreening.screenResult ===
                                    SCREENING_RESULT_PASS
                                  }
                                />
                                <label
                                  className="form-check-label"
                                  htmlFor="newDeferralTemporary"
                                >
                                  Temporary
                                </label>
                              </div>
                              <div className="form-check form-check-inline">
                                <input
                                  className="form-check-input"
                                  type="radio"
                                  name="deferralType"
                                  id="deferralPermanent"
                                  value={DEFERRAL_TYPE_PERMANENT}
                                  checked={
                                    newScreening.deferralType ===
                                    DEFERRAL_TYPE_PERMANENT
                                  }
                                  onChange={handleNewScreeningChange}
                                  disabled={
                                    newScreening.screenResult ===
                                    SCREENING_RESULT_PASS
                                  }
                                />
                                <label
                                  className="form-check-label"
                                  htmlFor="newDeferralPermanent"
                                >
                                  Permanent
                                </label>
                              </div>
                            </div>
                            {newScreeningErrors.deferralType && (
                              <div className="text-danger small mt-1">
                                {newScreeningErrors.deferralType}
                              </div>
                            )}
                          </div>

                          <div className="col-md-4">
                            <label className="form-label">
                              Deferral Reason
                            </label>
                            <textarea
                              className={`form-control ${errors.deferralReason ? "is-invalid" : ""}`}
                              name="deferralReason"
                              value={newScreening.deferralReason}
                              onChange={handleNewScreeningChange}
                              rows="2"
                              disabled={
                                newScreening.screenResult ===
                                `${SCREENING_RESULT_PASS}`
                              }
                            />
                            {newScreeningErrors.deferralReason && (
                              <div className="invalid-feedback">
                                {newScreeningErrors.deferralReason}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* <div className="mt-3 d-flex justify-content-end">
                      <button
                        type="button"
                        className="btn btn-success"
                        onClick={handleAddNewScreening}
                        disabled={
                          selectedRecord?.status === "a" ||
                          selectedRecord?.status === "p"
                        }
                      >
                        <i className="fa fa-plus me-2"></i>
                        Add Screening
                      </button>
                    </div> */}
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {
                  <div className="d-flex justify-content-end gap-2 mt-4">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleUpdate}
                      disabled={loading || !isEligibleForScreening}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Updating...
                        </>
                      ) : (
                        <>
                          <i className="fa fa-save me-2"></i>
                          Update Donor
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleBackToList}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List View with Search similar to PendingForCrossMatch
  const indexOfLastItem = currentPage * DEFAULT_ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - DEFAULT_ITEMS_PER_PAGE;
  const currentItems = donorList;

  return (
    <div className="content-wrapper">
      {popupMessage && (
        <Popup
          message={popupMessage.message}
          type={popupMessage.type}
          onClose={popupMessage.onClose}
        />
      )}

      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card form-card">
            <div className="card-header">
              <h4 className="card-title p-2 mb-0">
                Donor Registration View & Update
              </h4>
            </div>

            <div className="card-body">
              {/* Search Section - Similar to PendingForCrossMatch layout */}
              <div className="row g-3 align-items-end">
                <div className="col-md-4">
                  <label className="form-label fw-bold">Mobile No</label>
                  <input
                    type="text"
                    className="form-control"
                    name="mobileNo"
                    value={searchFilters.mobileNo}
                    onChange={handleSearchChange}
                    placeholder="Enter mobile number"
                    maxLength="10"
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-bold">Donor Name</label>
                  <div className="dropdown-search-container">
                    <input
                      type="text"
                      className="form-control"
                      name="donorName"
                      value={searchFilters.donorName}
                      onChange={handleSearchChange}
                      placeholder="Enter donor name"
                    />
                  </div>
                </div>

                <div className="col-md-4 gap-2 d-flex">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleSearch(0)}
                    disabled={searchLoading}
                  >
                    {searchLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Searching...
                      </>
                    ) : (
                      "Search"
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleReset}
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Donor List Table */}
              {searchPerformed && currentItems.length > 0 && (
                <div className="mt-4">
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover align-middle">
                      <thead>
                        <tr>
                          <th>Donor ID</th>
                          <th>Name</th>
                          <th>Mobile No.</th>
                          <th>Gender</th>
                          <th>Blood Group</th>
                          <th>Registration Date</th>
                          <th>Screening Result</th>
                          <th>Status</th>
                          <th className="text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="text-center">
                              No donors found.
                            </td>
                          </tr>
                        ) : (
                          currentItems.map((donor) => (
                            <tr key={donor.donorId}>
                              <td>{donor.donorCode || "N/A"}</td>
                              <td>{donor.name || "N/A"}</td>
                              <td>{donor.mobileNo || "N/A"}</td>
                              <td>{donor.gender || "N/A"}</td>
                              <td>{donor.bloodGroup || "N/A"}</td>
                              <td>{donor.registrationDate || "N/A"}</td>
                              <td>{getStatusBadge(donor.screeningResult)}</td>
                              <td>
                                {getApprovalStatusBadge(donor.status)}
                              </td>{" "}
                              {/* You may not have status field */}
                              <td className="text-center">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-primary"
                                  onClick={(e) => handleEditClick(donor, e)}
                                  title="View Donor"
                                >
                                  <i className="fa fa-eye"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {searchPerformed && totalPages >= 1 && (
                    <div className="mt-3">
                      <Pagination
                        totalItems={totalItems}
                        itemsPerPage={DEFAULT_ITEMS_PER_PAGE}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={(page) => handleSearch(page - 1)}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonorRegistrationViewUpdate;
