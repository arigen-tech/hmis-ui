import { useState, useEffect } from "react";
import { getRequest, postRequest } from "../../../service/apiService";
import LoadingScreen from "../../../Components/Loading";
import Popup from "../../../Components/popup";
import Pagination from "../../../Components/Pagination";
import {
  GET_PENDING_COLLECTION_DETAILS,
  GET_PENDING_COLLECTION_LIST,
  MAS_BLOOD_BAG_TYPE,
  MAS_BLOOD_COLLECTION_TYPE,
  MAS_BLOOD_DONATION_TYPE,
  SAVE_BLOOD_COLLECTION_DATA,
} from "../../../config/apiConfig";

const PendingBloodCollection = () => {
  const [pendingDonors, setPendingDonors] = useState([]);
  const [donationTypeData, setDonationTypeData] = useState([]);
  const [collectionTypeData, setCollectionTypeData] = useState([]);
  const [bagTypeData, setBagTypeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailView, setShowDetailView] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [popupMessage, setPopupMessage] = useState(null);
  const [errors, setErrors] = useState({});
  const [searchLoading, setSearchLoading] = useState(false);

  // Search state
  const [searchData, setSearchData] = useState({
    donorName: "",
    donorRegNo: "",
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Blood Collection Form State
  const [collectionForm, setCollectionForm] = useState({
    donorRegNo: "",
    donorName: "",
    bloodGroup: "",
    hemoglobin: "",
    weight: "",
    mobileNo: "",
    dob: "",
    lastScreening: "",
    gender: "",
    address1: "",
    address2: "",
    country: "",
    state: "",
    district: "",
    city: "",
    pinCode: "",
    height: "",
    bloodPressure: "",
    pulse: "",
    temperature: "",
    screenResult: "pass",
    donationType: "",
    collectionType: "",
    bagType: "",
    bagNumber: "",
    totalVolume: "",
    patientId: "",
    inpatientId: "",
  });

  const fetchPendingDonors = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);

      const params = new URLSearchParams();
      if (searchData.donorName)
        params.append("donorName", searchData.donorName);
      if (searchData.donorRegNo)
        params.append("donorRegNo", searchData.donorRegNo);

      const url = `${GET_PENDING_COLLECTION_LIST}${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await getRequest(url);

      if (response?.status === 200 && response?.response) {
        const mappedDonors = response.response.map((item) => ({
          id: item.donorId,
          donorRegNo: item.donorCode,
          donorFn: item.firstName || "",
          donorMn: "",
          donorLn: item.lastName || "",
          bloodGroupName: item.bloodGroup,
          lastScreeningDate: item.lastScreening,
          hemoglobin: item.hb,
          weight: item.weight,
        }));

        setPendingDonors(mappedDonors);
      } else {
        setPendingDonors([]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const fetchDonationTypeData = async () => {
    try {
      const response = await getRequest(`${MAS_BLOOD_DONATION_TYPE}/getAll/1`);
      if (response.status === 200 && response.response) {
        setDonationTypeData(response.response);
      } else {
        setDonationTypeData([]);
      }
    } catch (error) {
      console.error("Error fetching donation types:", error);
      setDonationTypeData([]);
    }
  };

  const fetchCollectionTypeData = async () => {
    try {
      const response = await getRequest(
        `${MAS_BLOOD_COLLECTION_TYPE}/getAll/1`,
      );
      console.log("Collection Type API Response:", response);

      if (response.status === 200 && response.response) {
        const mappedData = response.response.map((item) => ({
          id: item.collectionTypeId,
          collectionTypeName: item.collectionTypeName,
          code: item.collectionTypeCode,
        }));
        console.log("Mapped Collection Types:", mappedData);
        setCollectionTypeData(mappedData);
      } else {
        setCollectionTypeData([]);
      }
    } catch (error) {
      console.error("Error fetching collection types:", error);
      setCollectionTypeData([]);
    }
  };

  const fetchBagTypeData = async () => {
    try {
      const response = await getRequest(`${MAS_BLOOD_BAG_TYPE}/getAll/1`);

      console.log("Collection Type API Response:", response);
      if (response.status === 200 && response.response) {
        const mappedData = response.response.map((item) => ({
          id: item.bagTypeId,
          bagTypeName: item.bagTypeName,
          code: item.bagTypeCode,
        }));
        setBagTypeData(mappedData);
      } else {
        setCollectionTypeData([]);
      }
    } catch (error) {
      console.error("Error fetching bag types:", error);
    }
  };

  useEffect(() => {
    fetchPendingDonors();
    fetchDonationTypeData();
    fetchCollectionTypeData();
    fetchBagTypeData();
  }, []);

  const handleSearchChange = (e) => {
    const { id, value } = e.target;
    setSearchData((prev) => ({ ...prev, [id]: value }));
    setCurrentPage(1);
  };

  const handleSearch = async () => {
    try {
      setSearchLoading(true);
      setCurrentPage(1);

      await fetchPendingDonors();
    } catch (error) {
      console.error(error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleRowClick = async (donor) => {
    try {
      setLoading(true);

      const response = await getRequest(
        `${GET_PENDING_COLLECTION_DETAILS}?donorId=${donor.id}`,
      );

      if (response?.status === 200 && response?.response) {
        const fullDonor = response.response;
        setSelectedDonor(fullDonor);

        const now = new Date();

        setCollectionForm({
          donorRegNo: fullDonor.donorCode || "",
          donorName:
            `${fullDonor.firstName || ""} ${fullDonor.lastName || ""}`.trim(),
          bloodGroup: fullDonor.bloodGroup || "",
          hemoglobin: fullDonor.hemoglobin || "",
          weight: fullDonor.weight || "",
          mobileNo: fullDonor.mobileNo || "",
          dob: fullDonor.dateOfBirth || "",
          lastScreening: fullDonor.screeningDate || "",
          gender: fullDonor.gender || "",
          address1: fullDonor.addressLine1 || "",
          address2: fullDonor.addressLine2 || "",
          country: fullDonor.countryName || "",
          state: fullDonor.stateName || "",
          district: fullDonor.districtName || "",
          city: fullDonor.city || "",
          pinCode: fullDonor.pinCode || "",
          height: fullDonor.height || "",
          bloodPressure: fullDonor.bp || "",
          pulse: fullDonor.pulse || "",
          temperature: fullDonor.temperature || "",
          screenResult:
            fullDonor.donorScreeningStatus === "p" ? "pass" : "fail",
          donationType: "",
          collectionType: "",
          bagType: "",
          bagNumber: "",
          totalVolume: "",
          patientId: "",
          inpatientId: "",
        });

        setShowDetailView(true);
        setErrors({});
      } else {
        showPopup("Failed to load donor details", "error");
      }
    } catch (error) {
      console.error("Error fetching donor details:", error);
      showPopup("Failed to load donor details", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToList = () => {
    setShowDetailView(false);
    setSelectedDonor(null);
    setCollectionForm({
      donorRegNo: "",
      donorName: "",
      bloodGroup: "",
      hemoglobin: "",
      weight: "",
      mobileNo: "",
      dob: "",
      lastScreening: "",
      gender: "",
      address1: "",
      address2: "",
      country: "",
      state: "",
      district: "",
      city: "",
      pinCode: "",
      height: "",
      bloodPressure: "",
      pulse: "",
      temperature: "",
      screenResult: "pass",
      donationType: "",
      collectionType: "",
      bagType: "",
      bagNumber: "",
      totalVolume: "",
      patientId: "",
      inpatientId: "",
    });
    setErrors({});
  };

  const handleCollectionChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...collectionForm, [name]: value };
    if (name === "collectionType" && value) {
      const selectedType = collectionTypeData.find(
        (ct) => ct.id.toString() === value.toString(),
      );
      const typeCode =
        selectedType?.code || selectedType?.collectionTypeName || value;
      updatedForm.bagNumber = `${collectionForm.donorRegNo}-${typeCode}-${new Date().getTime()}`;
    }

    if (name === "bagType" && collectionForm.collectionType) {
      const selectedType = collectionTypeData.find(
        (ct) => ct.id.toString() === collectionForm.collectionType.toString(),
      );
      const typeCode =
        selectedType?.code ||
        selectedType?.collectionTypeName ||
        collectionForm.collectionType;
      updatedForm.bagNumber = `${collectionForm.donorRegNo}-${typeCode}-${new Date().getTime()}`;
    }

    setCollectionForm(updatedForm);

    // Clear validation error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateCollectionForm = () => {
    const newErrors = {};

    if (!collectionForm.donationType) {
      newErrors.donationType = "Donation Type is required";
    }
    if (!collectionForm.collectionType) {
      newErrors.collectionType = "Collection Type is required";
    }

    const selectedCollectionType = collectionTypeData.find(
      (ct) => ct.id.toString() === collectionForm.collectionType?.toString(),
    );
    if (
      selectedCollectionType?.collectionTypeName === "WB" &&
      !collectionForm.bagType
    ) {
      newErrors.bagType = "Bag Type is required for Whole Blood collection";
    }

    if (!collectionForm.totalVolume) {
      newErrors.totalVolume = "Total Volume is required";
    } else if (
      isNaN(parseFloat(collectionForm.totalVolume)) ||
      parseFloat(collectionForm.totalVolume) <= 0
    ) {
      newErrors.totalVolume = "Please enter a valid volume";
    }

    const selectedDonationType = donationTypeData.find(
      (dt) =>
        dt.donationTypeId?.toString() ===
        collectionForm.donationType?.toString(),
    );
    if (selectedDonationType) {
      const donationTypeName =
        selectedDonationType.donationTypeName?.toLowerCase() || "";
      if (
        donationTypeName === "replacement" ||
        donationTypeName === "autologous"
      ) {
        if (!collectionForm.patientId && !collectionForm.inpatientId) {
          newErrors.patientId =
            "Patient ID / Inpatient ID is required for Replacement/Autologous donation";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitCollection = async () => {
    if (!validateCollectionForm()) {
      showPopup("Please fill all mandatory fields", "warning");
      return;
    }

    try {
      setLoading(true);

      const collectionData = {
        donorId: selectedDonor.donorId || selectedDonor.id,
        screeningId: selectedDonor.screeningId,
        donationTypeId: Number(collectionForm.donationType),
        collectionTypeId: Number(collectionForm.collectionType),
        bagTypeId: collectionForm.bagType
          ? Number(collectionForm.bagType)
          : null,
        totalCollectedVolume: Number(collectionForm.totalVolume),
        // patientId: "",
        // inpatientId: "",
      };

      console.log("Submitting collection data:", collectionData);

      const response = await postRequest(
        `${SAVE_BLOOD_COLLECTION_DATA}`,
        collectionData,
      );

      if (response?.status === 200) {
        showPopup("Blood collection saved successfully!", "success", true);
      } else {
        showPopup(response?.message || "Failed to save", "error");
      }
    } catch (error) {
      console.error("API Error:", error);
      showPopup("Server error while saving collection", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (selectedDonor) {
      setCollectionForm({
        donorRegNo: selectedDonor.donorRegNo,
        donorName:
          `${selectedDonor.donorFn || ""} ${selectedDonor.donorMn || ""} ${selectedDonor.donorLn || ""}`.trim(),
        bloodGroup: selectedDonor.bloodGroupName,
        hemoglobin: selectedDonor.hemoglobin,
        weight: selectedDonor.weight,
        mobileNo: selectedDonor.donorMobileNumber,
        dob: selectedDonor.donorDob,
        lastScreening: selectedDonor.lastScreeningDate,
        gender: selectedDonor.donorGenderName || "",
        address1: selectedDonor.donorAddress1 || "",
        address2: selectedDonor.donorAddress2 || "",
        country: selectedDonor.donorCountryName || "India",
        state: selectedDonor.donorStateName || "",
        district: selectedDonor.donorDistrictName || "",
        city: selectedDonor.donorCity || "",
        pinCode: selectedDonor.donorPincode || "",
        height: selectedDonor.height || "",
        bloodPressure: selectedDonor.bloodPressure || "",
        pulse: selectedDonor.pulse || "",
        temperature: selectedDonor.temperature || "",
        screenResult: "pass",
        donationType: "",
        collectionType: "",
        bagType: "",
        bagNumber: "",
        totalVolume: "",
        patientId: "",
        inpatientId: "",
      });
      setErrors({});
    }
  };

  const showPopup = (message, type = "info", shouldRefreshData = false) => {
    setPopupMessage({
      message,
      type,
      onClose: async () => {
        setPopupMessage(null);

        if (shouldRefreshData) {
          handleBackToList();
          await fetchPendingDonors();
        }
      },
    });
  };

  // ============= UTILITY FUNCTIONS =============
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    });
  };

  const getHbStatusColor = (hbValue) => {
    const hb = parseFloat(hbValue);
    if (hb >= 13.5) return "text-success fw-bold";
    if (hb >= 12.5) return "text-warning fw-bold";
    return "fw-bold";
  };

  // ============= FILTERED & PAGINATED DATA =============
  const filteredDonors = pendingDonors.filter((donor) => {
    const donorName =
      `${donor.donorFn || ""} ${donor.donorMn || ""} ${donor.donorLn || ""}`.toLowerCase();
    const donorRegNo = donor.donorRegNo?.toLowerCase() || "";

    const donorNameMatch =
      searchData.donorName === "" ||
      donorName.includes(searchData.donorName.toLowerCase());

    const donorRegNoMatch =
      searchData.donorRegNo === "" ||
      donorRegNo.includes(searchData.donorRegNo.toLowerCase());

    return donorNameMatch && donorRegNoMatch;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredDonors.slice(indexOfFirstItem, indexOfLastItem);

  // ============= DETAIL VIEW (SCREEN 5) =============
  if (showDetailView && selectedDonor) {
    const selectedDonationType = donationTypeData.find(
      (dt) =>
        dt.donationTypeId?.toString() ===
        collectionForm.donationType?.toString(),
    );
    const showPatientFields =
      selectedDonationType?.donationTypeName === "Replacement" ||
      selectedDonationType?.donationTypeName === "Autologous";

    const selectedCollectionType = collectionTypeData.find(
      (ct) => ct.id.toString() === collectionForm.collectionType?.toString(),
    );
    // debugger
    const isWBCollection = selectedCollectionType?.code === "WB";

    return (
      <div className="body d-flex py-3">
        {popupMessage && (
          <Popup
            message={popupMessage.message}
            type={popupMessage.type}
            onClose={popupMessage.onClose}
          />
        )}
        {loading && <LoadingScreen />}

        <div className="container-fluid">
          <div className="row align-items-center mb-4">
            <div className="border-0">
              <div className="card-header py-3 no-bg bg-transparent d-flex align-items-center px-0 justify-content-between border-bottom flex-wrap">
                <h3 className="fw-bold mb-0">Pending For Blood Collection </h3>
                <button
                  className="btn btn-secondary"
                  onClick={handleBackToList}
                >
                  <i className="fa fa-arrow-left me-2"></i>
                  Back to List
                </button>
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
                      <label className="form-label  ">Donor Reg. No.</label>
                      <input
                        type="text"
                        className="form-control"
                        value={collectionForm.donorRegNo}
                        readOnly
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Donor Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={collectionForm.donorName}
                        readOnly
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Blood Group</label>
                      <input
                        type="text"
                        className="form-control"
                        value={collectionForm.bloodGroup}
                        readOnly
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Mobile No.</label>
                      <input
                        type="text"
                        className="form-control  "
                        value={collectionForm.mobileNo}
                        readOnly
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Gender</label>
                      <input
                        type="text"
                        className="form-control  "
                        value={collectionForm.gender}
                        readOnly
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Date of Birth</label>
                      <input
                        type="text"
                        className="form-control  "
                        value={formatDate(collectionForm.dob)}
                        readOnly
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Last Screening</label>
                      <input
                        type="text"
                        className="form-control  "
                        value={formatDate(collectionForm.lastScreening)}
                        readOnly
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label">Screen Result</label>
                      <input
                        type="text"
                        className="form-control bg-success text-white fw-bold"
                        value="PASS"
                        readOnly
                        style={{ backgroundColor: "#28a745" }}
                      />
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
                      <label className="form-label">Address 1</label>
                      <input
                        type="text"
                        className="form-control  "
                        value={collectionForm.address1}
                        readOnly
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Address 2</label>
                      <input
                        type="text"
                        className="form-control  "
                        value={collectionForm.address2}
                        readOnly
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Country</label>
                      <input
                        type="text"
                        className="form-control  "
                        value={collectionForm.country}
                        readOnly
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">State</label>
                      <input
                        type="text"
                        className="form-control  "
                        value={collectionForm.state}
                        readOnly
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">District</label>
                      <input
                        type="text"
                        className="form-control  "
                        value={collectionForm.district}
                        readOnly
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">City</label>
                      <input
                        type="text"
                        className="form-control  "
                        value={collectionForm.city}
                        readOnly
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Pin Code</label>
                      <input
                        type="text"
                        className="form-control  "
                        value={collectionForm.pinCode}
                        readOnly
                      />
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
                      <label className="form-label">Hemoglobin (g/dL)</label>
                      <input
                        type="text"
                        className="form-control  "
                        value={collectionForm.hemoglobin}
                        readOnly
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Weight (kg)</label>
                      <input
                        type="text"
                        className="form-control  "
                        value={collectionForm.weight}
                        readOnly
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Height (cm)</label>
                      <input
                        type="text"
                        className="form-control  "
                        value={collectionForm.height}
                        readOnly
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Blood Pressure</label>
                      <input
                        type="text"
                        className="form-control  "
                        value={collectionForm.bloodPressure}
                        readOnly
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Pulse Rate (bpm)</label>
                      <input
                        type="text"
                        className="form-control  "
                        value={collectionForm.pulse}
                        readOnly
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Temperature (°C)</label>
                      <input
                        type="text"
                        className="form-control  "
                        value={collectionForm.temperature}
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Collection Details */}
          <div className="row mb-3">
            <div className="col-sm-12">
              <div className="card shadow mb-3">
                <div className="card-header py-3 border-bottom-1">
                  <h6 className="mb-0 fw-bold">Collection Details</h6>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label">
                        Donation Type <span className="text-danger">*</span>
                      </label>
                      <select
                        className={`form-select ${errors.donationType ? "is-invalid" : ""}`}
                        name="donationType"
                        value={collectionForm.donationType}
                        onChange={handleCollectionChange}
                      >
                        <option value="">Select Donation Type</option>
                        {donationTypeData.map((type) => (
                          <option
                            key={type.donationTypeId}
                            value={type.donationTypeId}
                          >
                            {type.donationTypeName}
                          </option>
                        ))}
                      </select>
                      {errors.donationType && (
                        <div className="invalid-feedback">
                          {errors.donationType}
                        </div>
                      )}
                    </div>

                    <div className="col-md-4">
                      <label className="form-label">
                        Collection Type <span className="text-danger">*</span>
                      </label>
                      <select
                        className={`form-select ${errors.collectionType ? "is-invalid" : ""}`}
                        name="collectionType"
                        value={collectionForm.collectionType}
                        onChange={handleCollectionChange}
                      >
                        <option value="">Select Collection Type</option>
                        {collectionTypeData.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.collectionTypeName}
                          </option>
                        ))}
                      </select>
                      {errors.collectionType && (
                        <div className="invalid-feedback">
                          {errors.collectionType}
                        </div>
                      )}
                    </div>

                    <div className="col-md-4">
                      <label className="form-label">
                        Bag Type{" "}
                        {isWBCollection && (
                          <span className="text-danger">*</span>
                        )}
                      </label>
                      <select
                        className={`form-select ${errors.bagType ? "is-invalid" : ""}`}
                        name="bagType"
                        value={collectionForm.bagType}
                        onChange={handleCollectionChange}
                        disabled={!isWBCollection}
                      >
                        <option value="">Select Bag Type</option>
                        {bagTypeData.map((bag) => (
                          <option key={bag.id} value={bag.id}>
                            {bag.bagTypeName} ({bag.volume}ml)
                          </option>
                        ))}
                      </select>
                      {errors.bagType && (
                        <div className="invalid-feedback">{errors.bagType}</div>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Bag Number</label>
                      <input
                        type="text"
                        className="form-control  "
                        name="bagNumber"
                        value=""
                        readOnly
                        placeholder="Auto-generated"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">
                        Total Volume (ml) <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        className={`form-control ${errors.totalVolume ? "is-invalid" : ""}`}
                        name="totalVolume"
                        value={collectionForm.totalVolume}
                        onChange={handleCollectionChange}
                        placeholder="Enter volume in ml"
                        step="1"
                      />
                      {errors.totalVolume && (
                        <div className="invalid-feedback">
                          {errors.totalVolume}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Conditional Fields for Replacement/Autologous */}
          {showPatientFields && (
            <div className="row mb-3">
              <div className="col-sm-12">
                <div className="card shadow mb-3 ">
                  <div className="card-header py-3 bg-opacity-10">
                    <h6 className="mb-0 fw-bold ">
                      <i className="fa fa-hospital me-2"></i>
                      Patient Information (for{" "}
                      {selectedDonationType?.donationTypeName})
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">
                          Patient ID / Inpatient ID{" "}
                          <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className={`form-control ${errors.patientId ? "is-invalid" : ""}`}
                          name="patientId"
                          value={collectionForm.patientId}
                          onChange={handleCollectionChange}
                          placeholder="Enter Patient ID or Inpatient ID"
                        />
                        {errors.patientId && (
                          <div className="invalid-feedback">
                            {errors.patientId}
                          </div>
                        )}
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">
                          Inpatient ID (Alternative)
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          name="inpatientId"
                          value={collectionForm.inpatientId}
                          onChange={handleCollectionChange}
                          placeholder="Enter Inpatient ID"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="row mb-3">
            <div className="col-sm-12">
              <div className="card shadow mb-3">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <button
                        type="button"
                        className="btn btn-primary me-2"
                        onClick={handleSubmitCollection}
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
                            Save Collection
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary me-2"
                        onClick={handleReset}
                        disabled={loading}
                      >
                        <i className="fa fa-refresh me-2"></i>
                        Reset
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleBackToList}
                        disabled={loading}
                      >
                        <i className="fa fa-times me-2"></i>
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============= PENDING BLOOD COLLECTION LIST VIEW (SCREEN 4) =============
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
              <h4 className="card-title p-2">
                <i className="mdi mdi-blood-bag me-2 text-danger"></i>
                PENDING FOR BLOOD COLLECTION
              </h4>
            </div>

            <div className="card-body">
              {loading ? (
                <LoadingScreen />
              ) : (
                <>
                  {/* Search Section */}
                  <div className=" mb-3">
                    <form>
                      <div className="row g-4 align-items-end">
                        <div className="col-md-4">
                          <label className="form-label">Donor Reg. No.</label>
                          <input
                            type="text"
                            className="form-control"
                            id="donorRegNo"
                            placeholder="Enter donor registration no."
                            value={searchData.donorRegNo}
                            onChange={handleSearchChange}
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Donor Name</label>
                          <input
                            type="text"
                            className="form-control"
                            id="donorName"
                            placeholder="Enter donor name"
                            value={searchData.donorName}
                            onChange={handleSearchChange}
                          />
                        </div>
                        <div className="col-md-4 d-flex">
                          <button
                            type="button"
                            className="btn btn-primary me-2"
                            onClick={() => setCurrentPage(1)}
                          >
                            Search
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => {
                              setSearchData({ donorName: "", donorRegNo: "" });
                              setCurrentPage(1);
                            }}
                          >
                            <i className="mdi mdi-refresh"></i> Reset
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>

                  {/* Donors Table */}
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Donor Reg. No</th>
                          <th>Donor Name</th>
                          <th>Blood Group</th>
                          <th>Last Screening</th>
                          <th>Hb (g/dL)</th>
                          <th>Weight (kg)</th>
                          <th className="text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((donor) => {
                            const hemoglobin = parseFloat(
                              donor.hemoglobin || 0,
                            );
                            const isEligible = hemoglobin >= 12.5;

                            return (
                              <tr
                                key={donor.id}
                                onClick={() =>
                                  isEligible && handleRowClick(donor)
                                }
                                style={{
                                  cursor: isEligible ? "pointer" : "default",
                                }}
                                className={isEligible ? "table-row-hover" : ""}
                              >
                                <td>
                                  <span className="fw-bold">
                                    {donor.donorRegNo}
                                  </span>
                                </td>
                                <td>
                                  {`${donor.donorFn || ""} ${donor.donorMn || ""} ${donor.donorLn || ""}`.trim()}
                                </td>
                                <td>
                                  <span className="badge bg-danger bg-opacity-10 text-danger px-3 py-2">
                                    {donor.bloodGroupName}
                                  </span>
                                </td>
                                <td>{formatDate(donor.lastScreeningDate)}</td>
                                <td>
                                  <span
                                    className={getHbStatusColor(hemoglobin)}
                                  >
                                    {hemoglobin.toFixed(1)}
                                  </span>
                                </td>
                                <td>{donor.weight} kg</td>
                                <td className="text-center">
                                  <button
                                    className="btn btn-sm btn-danger"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRowClick(donor);
                                    }}
                                    disabled={!isEligible}
                                  >
                                    <i className="mdi mdi-blood-bag"></i>{" "}
                                    Collect Blood
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="7" className="text-center py-4">
                              <div className="text-muted">
                                <i className="mdi mdi-inbox mdi-48px"></i>
                                <h6 className="mt-2">
                                  No donors pending for blood collection
                                </h6>
                                <p className="mb-0">
                                  All screened donors have been processed
                                </p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {filteredDonors.length > 0 && (
                    <Pagination
                      totalItems={filteredDonors.length}
                      itemsPerPage={itemsPerPage}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingBloodCollection;
