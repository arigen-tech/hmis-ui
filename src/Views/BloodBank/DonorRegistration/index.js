import { getRequest, postRequest } from "../../../service/apiService";
import Popup from "../../../Components/popup";
import { useState, useEffect } from "react";
import LoadingScreen from "../../../Components/Loading";
import {
  MAS_GENDER,
  MAS_RELATION,
  MAS_BLOODGROUP,
  MAS_COUNTRY,
  STATE_BY_COUNTRY,
  DISTRICT_BY_STATE,
  DONOR_REGISTER,
} from "../../../config/apiConfig";
import {
  DEFERAL_REQUIRED_MSG,
  DEFERAL_TYPE_REQUIRED_MSG,
  INVALID_MOBILE_NUMBER,
  MISSING_MANDOTORY_FIELD_MSG,
  REGISTERED_DONOR,
} from "../../../config/constants";

const DonorRegistration = () => {
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [genderData, setGenderData] = useState([]);
  const [relationData, setRelationData] = useState([]);
  const [bloodGroupData, setBloodGroupData] = useState([]);
  const [countryData, setCountryData] = useState([]);
  const [stateData, setStateData] = useState([]);
  const [districtData, setDistrictData] = useState([]);
  const [popupMessage, setPopupMessage] = useState(null);

  const [formData, setFormData] = useState({
    personal: {
      firstName: "",
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
    },
    screening: {
      hemoglobin: "",
      weight: "",
      height: "",
      bloodPressure: "",
      pulse: "",
      temperature: "",
      screenResult: "",
      deferralType: "",
      deferralReason: "",
    },
  });

  const showPopup = (message, type = "info", onCloseCallback = null) => {
    setPopupMessage({
      message,
      type,
      onClose: () => {
        setPopupMessage(null);
        if (onCloseCallback) {
          onCloseCallback();
        }
      },
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (formData.personal.hasOwnProperty(name)) {
      setFormData((prev) => ({
        ...prev,
        personal: {
          ...prev.personal,
          [name]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        screening: {
          ...prev.screening,
          [name]: value,
        },
      }));
    }
  };

  const fetchGenderData = async () => {
    setLoading(true);
    try {
      const data = await getRequest(`${MAS_GENDER}/getAll/1`);
      if (data.status === 200) {
        setGenderData(data.response || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelationData = async () => {
    setLoading(true);
    try {
      const data = await getRequest(`${MAS_RELATION}/getAll/1`);
      if (data.status === 200) {
        setRelationData(data.response || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBloodGroupData = async () => {
    setLoading(true);
    try {
      const data = await getRequest(`${MAS_BLOODGROUP}/getAll/1`);
      if (data.status === 200) {
        setBloodGroupData(data.response || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCountryData = async () => {
    setLoading(true);
    try {
      const data = await getRequest(`${MAS_COUNTRY}/getAll/1`);
      if (data.status === 200) {
        setCountryData(data.response || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStates = async (countryId) => {
    try {
      const data = await getRequest(`${STATE_BY_COUNTRY}${countryId}`);
      if (data.status === 200) {
        setStateData(data.response || []);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const fetchDistrict = async (stateId) => {
    try {
      const data = await getRequest(`${DISTRICT_BY_STATE}${stateId}`);
      if (data.status === 200) {
        setDistrictData(data.response || []);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    fetchGenderData();
    fetchRelationData();
    fetchBloodGroupData();
    fetchCountryData();
  }, []);

  const validateForm = () => {
    const newErrors = {};
    const { personal, screening } = formData;

    if (!personal.firstName.trim())
      newErrors.firstName = "First Name is required";

    if (!personal.mobileNo.trim()) newErrors.mobileNo = "Mobile is required";

    if (!screening.hemoglobin) newErrors.hemoglobin = "Hemoglobin is required";

    if (!screening.screenResult)
      newErrors.screenResult = "Screen Result required";

    if (screening.screenResult === "fail") {
      if (!screening.deferralType)
        newErrors.deferralType = DEFERAL_TYPE_REQUIRED_MSG;

      if (!screening.deferralReason.trim())
        newErrors.deferralReason = DEFERAL_REQUIRED_MSG;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showPopup(MISSING_MANDOTORY_FIELD_MSG, "warning");
      return;
    }

    try {
      setLoading(true);

      const { personal, screening } = formData;
      const requestBody = {
        bloodDonorPersonalDetailsRequest: {
          firstName: personal.firstName,
          lastName: personal.lastName,
          genderId: personal.gender,
          dateOfBirth: personal.dob,
          mobileNo: personal.mobileNo,
          bloodGroupId: personal.bloodGroup,
          donationTypeId: null,
          relation: personal.relation,
          donorStatus: "ACTIVE",
          currentDeferralReason: screening.deferralReason || "",
          deferralUptoDate: null,
          addressLine1: personal.address1,
          addressLine2: personal.address2,
          countryId: personal.country,
          stateId: personal.state,
          districtId: personal.district,
          city: personal.city,
          pincode: personal.pinCode,
          remarks: "",
        },
        bloodDonorScreeningRequest: {
          screeningDate: new Date().toISOString().split("T")[0],
          hemoglobin: parseFloat(screening.hemoglobin),
          weightKg: parseFloat(screening.weight),
          heightCm: parseFloat(screening.height),
          bloodPressure: screening.bloodPressure,
          pulseRate: parseInt(screening.pulse),
          temperature: parseFloat(screening.temperature),
          screeningResult: screening.screenResult,
          deferralType: screening.deferralType || "",
          deferralReason: screening.deferralReason || "",
          deferralUptoDate: null,
          remarks: "",
        },
      };

      const result = await postRequest(DONOR_REGISTER, requestBody);

      if (result.status === 200) {
        showPopup(REGISTERED_DONOR, "success", handleReset);
      } else {
        showPopup(result.message || "Registration failed", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      showPopup("An error occurred", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      personal: {
        firstName: "",
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
      },
      screening: {
        hemoglobin: "",
        weight: "",
        height: "",
        bloodPressure: "",
        pulse: "",
        temperature: "",
        screenResult: "",
        deferralType: "",
        deferralReason: "",
      },
    });

    setErrors({});
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="body d-flex py-3">
      {popupMessage && (
        <Popup
          message={popupMessage.message}
          type={popupMessage.type}
          onClose={popupMessage.onClose}
        />
      )}

      <div className="container-fluid">
        <div className="row align-items-center">
          <div className="border-0 mb-4">
            <div className="card-header  py-3 no-bg bg-transparent d-flex align-items-center px-0 justify-content-between border-bottom flex-wrap">
              <h3 className="fw-bold mb-0">Donor Information</h3>
            </div>
          </div>
        </div>

        {/* Personal Details */}
        <div className="row mb-3">
          <div className="col-sm-12">
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
                      value={formData.personal.firstName}
                      onChange={handleChange}
                      placeholder="Enter First Name"
                    />
                    {errors.firstName && (
                      <div className="invalid-feedback">{errors.firstName}</div>
                    )}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">
                      Last Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.personal.lastName}
                      onChange={handleChange}
                      className={`form-control ${errors.lastName ? "is-invalid" : ""}`}
                      placeholder="Enter Last Name"
                    />
                    {errors.lastName && (
                      <div className="invalid-feedback">{errors.lastName}</div>
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
                      value={formData.personal.mobileNo}
                      maxLength={10}
                      onChange={handleChange}
                      placeholder="Enter Mobile Number"
                    />
                    {errors.mobileNo && (
                      <div className="invalid-feedback">{errors.mobileNo}</div>
                    )}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">
                      Gender <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select ${errors.gender ? "is-invalid" : ""}`}
                      name="gender"
                      value={formData.personal.gender}
                      onChange={handleChange}
                    >
                      <option value="">Select Gender</option>
                      {genderData.map((gender) => (
                        <option key={gender.id} value={gender.id}>
                          {gender.genderName}
                        </option>
                      ))}
                    </select>
                    {errors.gender && (
                      <div className="invalid-feedback">{errors.gender}</div>
                    )}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">
                      Relation <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select ${errors.relation ? "is-invalid" : ""}`}
                      name="relation"
                      value={formData.personal.relation}
                      onChange={handleChange}
                    >
                      <option value="">Select Relation</option>
                      {relationData.map((relation) => (
                        <option key={relation.id} value={relation.id}>
                          {relation.relationName}
                        </option>
                      ))}
                    </select>
                    {errors.relation && (
                      <div className="invalid-feedback">{errors.relation}</div>
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
                      value={formData.personal.dob}
                      max={new Date().toISOString().split("T")[0]}
                      onChange={handleChange}
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
                      value={formData.personal.bloodGroup}
                      onChange={handleChange}
                    >
                      <option value="">Select Blood Group</option>
                      {bloodGroupData.map((bloodGroup) => (
                        <option key={bloodGroup.id} value={bloodGroup.id}>
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
          </div>
        </div>

        {/* Address Details */}
        <div className="row mb-3">
          <div className="col-sm-12">
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
                      value={formData.personal.address1}
                      onChange={handleChange}
                      placeholder="Enter Address 1"
                    />
                    {errors.address1 && (
                      <div className="invalid-feedback">{errors.address1}</div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Address 2</label>
                    <input
                      type="text"
                      className="form-control"
                      name="address2"
                      value={formData.personal.address2}
                      onChange={handleChange}
                      placeholder="Enter Address 2"
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">
                      Country <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select ${errors.country ? "is-invalid" : ""}`}
                      name="country"
                      value={formData.personal.country}
                      onChange={(e) => {
                        handleChange(e);
                        fetchStates(e.target.value);
                      }}
                    >
                      <option value="">Select Country</option>
                      {countryData.map((country) => (
                        <option key={country.id} value={country.id}>
                          {country.countryName}
                        </option>
                      ))}
                    </select>
                    {errors.country && (
                      <div className="invalid-feedback">{errors.country}</div>
                    )}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">
                      State <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select ${errors.state ? "is-invalid" : ""}`}
                      name="state"
                      value={formData.personal.state}
                      onChange={(e) => {
                        handleChange(e);
                        fetchDistrict(e.target.value);
                      }}
                      disabled={!formData.personal.country}
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
                      value={formData.personal.district}
                      onChange={handleChange}
                      disabled={!formData.personal.state}
                    >
                      <option value="">Select District</option>
                      {districtData.map((district) => (
                        <option key={district.id} value={district.id}>
                          {district.districtName}
                        </option>
                      ))}
                    </select>
                    {errors.district && (
                      <div className="invalid-feedback">{errors.district}</div>
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
                      value={formData.personal.city}
                      onChange={handleChange}
                      placeholder="Enter City"
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
                      value={formData.personal.pinCode}
                      maxLength={6}
                      onChange={handleChange}
                      placeholder="Enter Pin Code"
                    />
                    {errors.pinCode && (
                      <div className="invalid-feedback">{errors.pinCode}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Screening Details */}
        <div className="row mb-3">
          <div className="col-sm-12">
            <div className="card shadow mb-3">
              <div className="card-header py-3 border-bottom-1">
                <h6 className="mb-0 fw-bold">Screening Details</h6>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">
                      Hemoglobin (g/dL) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className={`form-control ${errors.hemoglobin ? "is-invalid" : ""}`}
                      name="hemoglobin"
                      value={formData.screening.hemoglobin}
                      onChange={handleChange}
                      placeholder="Enter Hemoglobin"
                      step="0.1"
                    />
                    {errors.hemoglobin && (
                      <div className="invalid-feedback">
                        {errors.hemoglobin}
                      </div>
                    )}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">
                      Weight (kg) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className={`form-control ${errors.weight ? "is-invalid" : ""}`}
                      name="weight"
                      value={formData.screening.weight}
                      onChange={handleChange}
                      placeholder="Enter Weight"
                      step="0.1"
                    />
                    {errors.weight && (
                      <div className="invalid-feedback">{errors.weight}</div>
                    )}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">
                      Height (cm) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className={`form-control ${errors.height ? "is-invalid" : ""}`}
                      name="height"
                      value={formData.screening.height}
                      onChange={handleChange}
                      placeholder="Enter Height"
                      step="0.1"
                    />
                    {errors.height && (
                      <div className="invalid-feedback">{errors.height}</div>
                    )}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">
                      Blood Pressure <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${errors.bloodPressure ? "is-invalid" : ""}`}
                      name="bloodPressure"
                      value={formData.screening.bloodPressure}
                      onChange={handleChange}
                      placeholder="120/80"
                    />
                    {errors.bloodPressure && (
                      <div className="invalid-feedback">
                        {errors.bloodPressure}
                      </div>
                    )}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">
                      Pulse Rate (bpm) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className={`form-control ${errors.pulse ? "is-invalid" : ""}`}
                      name="pulse"
                      value={formData.screening.pulse}
                      onChange={handleChange}
                      placeholder="Enter Pulse Rate"
                    />
                    {errors.pulse && (
                      <div className="invalid-feedback">{errors.pulse}</div>
                    )}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">
                      Temperature (°C) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className={`form-control ${errors.temperature ? "is-invalid" : ""}`}
                      name="temperature"
                      value={formData.screening.temperature}
                      onChange={handleChange}
                      placeholder="Enter Temperature"
                      step="0.1"
                    />
                    {errors.temperature && (
                      <div className="invalid-feedback">
                        {errors.temperature}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Screening Result Section */}
        <div className="row mb-3">
          <div className="col-sm-12">
            <div className="card shadow mb-3">
              <div className="card-header py-3 border-bottom-1">
                <h6 className="mb-0 fw-bold">Screening Result</h6>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">
                      Screen Result <span className="text-danger">*</span>
                    </label>
                    <div>
                      <div className="form-check form-check-inline">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="screenResult"
                          id="screenPass"
                          value="pass"
                          checked={formData.screening.screenResult === "pass"}
                          onChange={handleChange}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="screenPass"
                        >
                          Pass
                        </label>
                      </div>
                      <div className="form-check form-check-inline">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="screenResult"
                          id="screenFail"
                          value="fail"
                          checked={formData.screening.screenResult === "fail"}
                          onChange={handleChange}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="screenFail"
                        >
                          Fail
                        </label>
                      </div>
                    </div>
                    {errors.screenResult && (
                      <div className="text-danger small mt-1">
                        {errors.screenResult}
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
                          value="temporary"
                          checked={formData.screening.deferralType === "temporary"}
                          onChange={handleChange}
                          disabled={formData.screening.screenResult === "pass"}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="deferralTemporary"
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
                          value="permanent"
                          checked={formData.screening.deferralType === "permanent"}
                          onChange={handleChange}
                          disabled={formData.screening.screenResult === "pass"}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="deferralPermanent"
                        >
                          Permanent
                        </label>
                      </div>
                    </div>
                    {errors.deferralType && (
                      <div className="text-danger small mt-1">
                        {errors.deferralType}
                      </div>
                    )}
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Deferral Reason</label>
                    <textarea
                      className={`form-control ${errors.deferralReason ? "is-invalid" : ""}`}
                      name="deferralReason"
                      value={formData.screening.deferralReason}
                      onChange={handleChange}
                      rows="2"
                      disabled={formData.screening.screenResult === "pass"}
                    />
                    {errors.deferralReason && (
                      <div className="invalid-feedback">
                        {errors.deferralReason}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="row mb-3">
          <div className="col-sm-12">
            <div className="card shadow mb-3">
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Processing...
                      </>
                    ) : (
                      <>
                        <i className="fa fa-save me-2"></i>
                        Register Donor
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleReset}
                    disabled={loading}
                  >
                    <i className="fa fa-refresh me-2"></i>
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonorRegistration;
